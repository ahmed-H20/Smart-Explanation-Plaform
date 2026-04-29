const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionsModel");
const ApiError = require("../utils/ApiError");
const studentModel = require("../models/studentsModel");
const instructorModel = require("../models/instructorsModel");
const ApiFeatures = require("../utils/ApiFeatures");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Fetch wallet by userId and throw if missing or locked.
 * Pass `checkLock = false` to skip the lock check (e.g. admin ops).
 */
const getWalletOrFail = async (
	userId,
	{ session = null, checkLock = true } = {},
) => {
	const query = Wallet.findOne({ userId });
	if (session) query.session(session);

	const wallet = await query;
	if (!wallet) throw new ApiError("This user does not have a wallet.", 404);
	if (checkLock && wallet.isLocked)
		throw new ApiError("This wallet is locked.", 403);

	return wallet;
};

/**
 * Fetch a pending withdraw transaction and throw if not found or not pending.
 */
const getPendingWithdrawOrFail = async (
	transactionId,
	{ session = null } = {},
) => {
	const query = Transaction.findById(transactionId);
	if (session) query.session(session);

	const transaction = await query;
	if (!transaction) throw new ApiError("Transaction not found.", 404);
	if (transaction.reason !== "withdraw")
		throw new ApiError("Transaction is not a withdraw.", 400);
	if (transaction.status !== "pending") {
		throw new ApiError(`Transaction is already ${transaction.status}.`, 400);
	}

	return transaction;
};

// ─────────────────────────────────────────────
// User — read
// ─────────────────────────────────────────────

// @desc    Get logged user wallet
// @route   GET /wallet/me
// @access  Private (user)
const getLoggedUserWallet = asyncHandler(async (req, res, next) => {
	const wallet = await getWalletOrFail(req.user._id, { checkLock: false });

	res.status(200).json({ status: "success", data: wallet });
});

// @desc    Get logged user balance
// @route   GET /wallet/balance
// @access  Private (user)
const getLoggedUserBalance = asyncHandler(async (req, res, next) => {
	const wallet = await getWalletOrFail(req.user._id, { checkLock: false });

	res
		.status(200)
		.json({ status: "success", data: { balanceUSD: wallet.balanceUSD } });
});

// @desc    Get logged user freezed balance
// @route   GET /wallet/me/freezedBalance
// @access  Private (user)
const getLoggedUserFreezedBalance = asyncHandler(async (req, res, next) => {
	const wallet = await getWalletOrFail(req.user._id, { checkLock: false });

	res.status(200).json({
		status: "success",
		data: { freezedBalanceUSD: wallet.freezedBalanceUSD },
	});
});

// @desc    Get logged user transactions (paginated, newest first)
// @route   GET /wallet/me/transactions
// @access  Private (user)
const getLoggedUserTransactions = asyncHandler(async (req, res, next) => {
	const wallet = await getWalletOrFail(req.user._id, { checkLock: false });

	const page = Math.max(1, parseInt(req.query.page, 10) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
	const skip = (page - 1) * limit;

	const [transactions, total] = await Promise.all([
		Transaction.find({ wallet: wallet._id })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		Transaction.countDocuments({ wallet: wallet._id }),
	]);

	res.status(200).json({
		status: "success",
		pagination: {
			total,
			page,
			limit,
			pages: Math.ceil(total / limit),
		},
		data: transactions,
	});
});

// ─────────────────────────────────────────────
// Instructor — withdraw
// ─────────────────────────────────────────────

// @desc    Request a withdrawal (moves balance → freezedBalance, creates pending tx)
// @route   POST /wallet/withdraw
// @access  Private (instructor)
const requestWithdraw = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { amountUSD, platform } = req.body;

		if (
			!amountUSD ||
			Number.isNaN(Number(amountUSD)) ||
			Number(amountUSD) <= 0
		) {
			throw new ApiError("Amount must be a positive number.", 400);
		}

		if (!platform) {
			throw new ApiError(
				"You should select platform instapay or vodafoneCash",
				400,
			);
		}

		const numericAmount = Number(amountUSD);

		// findOneAndUpdate with $inc is atomic — prevents race conditions /
		// double-withdraw without needing an extra lock document.
		const wallet = await Wallet.findOneAndUpdate(
			{
				userId: req.user._id,
				isLocked: false,
				balanceUSD: { $gte: numericAmount }, // sufficient balance guard
			},
			{
				$inc: {
					balanceUSD: -numericAmount,
					freezedBalanceUSD: numericAmount,
				},
			},
			{ new: true, session },
		);

		if (!wallet) {
			// Distinguish between "no wallet", "locked", and "insufficient funds"
			const existing = await Wallet.findOne({ userId: req.user._id }).session(
				session,
			);
			if (!existing) throw new ApiError("Wallet not found.", 404);
			if (existing.isLocked) throw new ApiError("المحفظة مغلقة!", 403);
			throw new ApiError("رصيد غير كافى!", 400);
		}

		const balanceBeforeUSD = wallet.balanceUSD + numericAmount; // value before the deduction

		const transaction = await Transaction.create(
			[
				{
					wallet: wallet._id,
					type: "debit",
					status: "pending",
					amountUSD: numericAmount,
					reason: "withdraw",
					referenceId: wallet._id,
					referenceModel: "Wallet",
					balanceBeforeUSD,
					platform,
					balanceAfterUSD: wallet.balanceUSD,
				},
			],
			{ session },
		);

		await session.commitTransaction();
		session.endSession();

		res.status(201).json({
			status: "success",
			message: "Withdrawal request submitted and is pending admin approval.",
			data: {
				balance: `${wallet.balanceUSD} USD`,
				freezedBalance: `${wallet.freezedBalanceUSD} USD`,
				transaction: transaction._id,
				wallet,
			},
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		return next(err);
	}
});

// ─────────────────────────────────────────────
// Admin — withdraw management
// ─────────────────────────────────────────────

// @desc    Approve a pending withdrawal (deducts from freezedBalance, marks completed)
// @route   PATCH /wallet/withdraw/:id/approve
// @access  Private (admin)
const approveWithdraw = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const transaction = await getPendingWithdrawOrFail(
			req.params.transactionID,
			{
				session,
			},
		);

		const wallet = await Wallet.findOneAndUpdate(
			{
				_id: transaction.wallet,
				freezedBalanceUSD: { $gte: transaction.amountUSD }, // safety guard
			},
			{
				$inc: {
					freezedBalanceUSD: -transaction.amountUSD, // from freezed balance to cash
				},
			},
			{ new: true, session },
		);

		if (!wallet) {
			throw new ApiError(
				"Wallet not found or freezed balance is inconsistent.",
				500,
			);
		}

		transaction.status = "completed";
		await transaction.save({ session });

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			status: "success",
			message: "Withdrawal approved successfully.",
			data: transaction,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		return next(err);
	}
});

// @desc    Reject a pending withdrawal (returns amount from freezedBalance → balance)
// @route   PATCH /wallet/withdraw/:id/reject
// @access  Private (admin)
const rejectWithdraw = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const transaction = await getPendingWithdrawOrFail(
			req.params.transactionID,
			{
				session,
			},
		);

		const wallet = await Wallet.findOneAndUpdate(
			{
				_id: transaction.wallet,
				freezedBalanceUSD: { $gte: transaction.amountUSD },
			},
			{
				$inc: {
					freezedBalanceUSD: -transaction.amountUSD,
					balanceUSD: transaction.amountUSD,
				},
			},
			{ new: true, session },
		);

		if (!wallet) {
			throw new ApiError(
				"Wallet not found or freezed balance is inconsistent.",
				500,
			);
		}

		transaction.status = "failed";
		await transaction.save({ session });

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			status: "success",
			message: "Withdrawal rejected and amount returned to balance.",
			data: transaction,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		return next(err);
	}
});

// @desc    Attach a receipt URL to a completed/pending withdrawal transaction
// @route   PATCH /wallet/withdraw/:id/receipt
// @access  Private (admin)
const uploadWithdrawReceipt = asyncHandler(async (req, res, next) => {
	const { transactionID } = req.params;

	// Expect the upload middleware to place the URL in req.receiptUrl
	// (or fall back to req.body.receiptUrl for manual testing)
	const receiptUrl = req.receiptUrl || req.body.receiptUrl;
	if (!receiptUrl) {
		return next(new ApiError("No receipt URL provided.", 400));
	}

	const transaction = await Transaction.findOneAndUpdate(
		{ _id: transactionID, reason: "withdraw", receipt: null },
		{ receipt: `${process.env.BASE_URL}/receipts/${receiptUrl}` },
		{ new: true, runValidators: true },
	);

	if (!transaction) {
		return next(
			new ApiError(
				"Withdraw transaction not found or you already upload receipt",
				404,
			),
		);
	}

	res.status(200).json({
		status: "success",
		message: "Receipt uploaded successfully.",
		data: transaction,
	});
});

//@desc get all requests
//@route GET /wallets/withdrawelRequests
// @access  Private (admin)
const getAllWithdrawalRequests = asyncHandler(async (req, res, next) => {
	const documentsCount = await Transaction.countDocuments();
	// Query build
	const productsData = new ApiFeatures(
		Transaction.find({
			reason: "withdraw",
		}),
		req.query,
	)
		.filter()
		.search()
		.build()
		.pagination(documentsCount)
		.limitation()
		.sort();

	const { mongooseQuery, pagination } = productsData;

	const document = await mongooseQuery;
	res.status(200).json({
		paginationResults: pagination,
		results: document.length,
		data: document,
	});
});

// ─────────────────────────────────────────────
// Admin — wallet management
// ─────────────────────────────────────────────

// @desc    Lock a user wallet
// @route   PUT /wallet/lock/:id
// @access  Private (admin)
const lockWallet = asyncHandler(async (req, res, next) => {
	const { email } = req.body;

	const user =
		(await studentModel.findOne({ email })) ||
		(await instructorModel.findOne({ email }));

	if (!user) {
		return next(new ApiError("No user for this email", 404));
	}

	const userType = user.constructor.modelName;

	const wallet = await Wallet.findOneAndUpdate(
		{ userId: user._id, userType },
		{ isLocked: true },
		{ new: true },
	);
	if (!wallet)
		return next(new ApiError("This user does not have a wallet.", 404));

	res.status(200).json({
		status: "success",
		message: `Wallet for user ${user.fullName} is locked 🔒`,
	});
});

// @desc    Unlock a user wallet
// @route   PUT /wallet/unlock/:id
// @access  Private (admin)
const unLockWallet = asyncHandler(async (req, res, next) => {
	const { email } = req.body;

	const user =
		(await studentModel.findOne({ email })) ||
		(await instructorModel.findOne({ email }));

	if (!user) {
		return next(new ApiError("No user for this email", 404));
	}

	const userType = user.constructor.modelName;

	const wallet = await Wallet.findOneAndUpdate(
		{ userId: user._id, userType },
		{ isLocked: true },
		{ new: true },
	);
	if (!wallet)
		return next(new ApiError("This user does not have a wallet.", 404));

	res.status(200).json({
		status: "success",
		message: `Wallet for user ${user.fullName} is unlocked 🔓`,
	});
});

// @desc    Manually charge a wallet (admin override)
// @route   PUT /wallet/charge/:id
// @access  Private (admin)
const chargeWalletManually = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { email } = req.body;

		const user =
			(await studentModel.findOne({ email })) ||
			(await instructorModel.findOne({ email }));

		if (!user) {
			return next(new ApiError("No user for this email", 404));
		}

		const userType = user.constructor.modelName;

		const balance = req.body.balanceUSD; // in dollar

		if (!balance || Number.isNaN(Number(balance)) || Number(balance) <= 0) {
			throw new ApiError("Amount must be a positive number.", 400);
		}

		const numericBalance = Number(balance);

		const wallet = await Wallet.findOne({ userId: user._id, userType }).session(
			session,
		);
		if (!wallet) throw new ApiError("Wallet not found.", 404);

		const balanceBeforeUSD = wallet.balanceUSD;
		wallet.balanceUSD += numericBalance;
		await wallet.save({ session });

		await Transaction.create(
			[
				{
					wallet: wallet._id,
					type: "credit",
					status: "completed",
					amountUSD: numericBalance,
					reason: "manual_charge_by_admin",
					referenceId: wallet._id,
					referenceModel: "Wallet",
					balanceBeforeUSD,
					balanceAfterUSD: wallet.balanceUSD,
				},
			],
			{ session },
		);

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			status: "success",
			message: "Wallet charged successfully.",
			data: wallet,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		return next(err);
	}
});

module.exports = {
	// User
	getLoggedUserWallet,
	getLoggedUserBalance,
	getLoggedUserFreezedBalance,
	getLoggedUserTransactions,
	// Instructor
	requestWithdraw,
	// Admin — withdrawals
	approveWithdraw,
	rejectWithdraw,
	uploadWithdrawReceipt,
	getAllWithdrawalRequests,
	// Admin — wallet management
	lockWallet,
	unLockWallet,
	chargeWalletManually,
};
