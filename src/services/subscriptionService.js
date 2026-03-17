const mongoose = require("mongoose");
const Subscription = require("../models/subscriptionModel");
const SubscriptionPlan = require("../models/SubscriptionplanModel");
const Wallet = require("../models/walletModel"); // Adjust path to your existing wallet model
const Transaction = require("../models/transactionsModel"); // Adjust path to your existing transaction model
const Major = require("../models/majorModel");
const ApiError = require("../utils/ApiError"); // Adjust path to your existing ApiError utility

/**
 * Subscribe a student to a plan.
 * Runs fully inside a MongoDB session to guarantee atomicity:
 *   wallet debit + transaction record + subscription document
 * are either ALL committed or ALL rolled back.
 *
 * @param {Object} options
 * @param {string} options.studentId   - Authenticated student's _id
 * @param {string} options.planId      - SubscriptionPlan _id
 * @param {string} options.majorId     - Major _id the subscription is bound to
 * @returns {Promise<Subscription>}
 */
const createSubscription = async ({ studentId, planId, majorId }) => {
	// ── 1. Validate plan outside the session (read-only, no write contention) ──
	const plan = await SubscriptionPlan.findById(planId);

	if (!plan) {
		throw new ApiError("Subscription plan not found", 404);
	}

	if (!plan.isActive) {
		throw new ApiError("This subscription plan is no longer available", 400);
	}

	// ── 2. Fetch wallet outside the session for the same reason ──
	const wallet = await Wallet.findOne({
		userId: studentId,
		userType: "Student",
	});

	if (!wallet) {
		throw new ApiError("Wallet not found for this student", 404);
	}

	if (wallet.isLocked) {
		throw new ApiError("Your wallet is locked. Please contact support.", 403);
	}

	if (wallet.balance < plan.price) {
		throw new ApiError(
			`Insufficient wallet balance. Required: ${plan.price} ${plan.currency}, Available: ${wallet.balance} ${wallet.currencyCode}`,
			400,
		);
	}

	// ── 3. Guard: prevent duplicate active subscription (same student + plan) ──
	// We check explicitly here for a clear error message before hitting the
	// unique partial index which would throw a less readable duplicate-key error.
	const existingActive = await Subscription.findOne({
		studentId,
		planId,
		status: "active",
	});

	if (existingActive) {
		throw new ApiError(
			"You already have an active subscription for this plan",
			409,
		);
	}

	// ── 4. Open a MongoDB session and run the write operations atomically ──
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		// 4a. Deduct the plan price from the student's wallet balance
		const balanceBefore = wallet.balance;
		const balanceAfter = balanceBefore - plan.price;

		await Wallet.findByIdAndUpdate(
			wallet._id,
			{ $inc: { balance: -plan.price } },
			{ session, new: true },
		);

		// 4b. Record the debit as a WalletTransaction
		// referenceId will be filled with the subscription _id after creation,
		// so we create the subscription first (within the same session) then
		// back-reference it. Alternatively we pre-generate an ObjectId.
		const subscriptionId = new mongoose.Types.ObjectId();

		await Transaction.create(
			[
				{
					wallet: wallet._id,
					type: "debit",
					status: "completed",
					amount: plan.price,
					reason: "subscription_payment",
					referenceId: subscriptionId,
					referenceModel: "Subscription", // extend your enum if needed
					balanceBefore,
					balanceAfter,
					description: `Subscription payment for plan: ${plan.name}`,
				},
			],
			{ session },
		);

		// 4c. Build subscription dates
		const startDate = new Date();
		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + plan.durationDays);

		// 4d. Create the Subscription document with the pre-generated _id
		const [subscription] = await Subscription.create(
			[
				{
					_id: subscriptionId,
					studentId,
					planId,
					majorId,
					status: "active",
					startDate,
					endDate,
					paymentStatus: "paid",
				},
			],
			{ session },
		);

		await session.commitTransaction();

		return subscription;
	} catch (err) {
		await session.abortTransaction();

		// Re-throw ApiError instances as-is; wrap unexpected DB errors
		if (err instanceof ApiError) throw err;

		// Duplicate key from the partial unique index (race condition edge case)
		if (err.code === 11000) {
			throw new ApiError(
				"You already have an active subscription for this plan",
				409,
			);
		}

		throw new ApiError(`Subscription creation failed: ${err.message}`, 500);
	} finally {
		session.endSession();
	}
};

/**
 * Get all subscriptions — admin view.
 * Supports optional filters: status, studentId.
 *
 * @param {Object} filters
 * @param {string} [filters.status]
 * @param {string} [filters.studentId]
 * @returns {Promise<Subscription[]>}
 */
const getAllSubscriptions = async ({ status, studentId } = {}) => {
	const filter = {};

	if (status) {
		const allowed = ["active", "cancelled", "expired"];
		if (!allowed.includes(status)) {
			throw new ApiError(
				`Invalid status filter. Allowed values: ${allowed.join(", ")}`,
				400,
			);
		}
		filter.status = status;
	}

	if (studentId) {
		filter.studentId = studentId;
	}

	const subscriptions = await Subscription.find(filter)
		.populate("planId", "name durationDays price currency")
		.populate("majorId", "name")
		.populate("studentId", "fullName email")
		.sort({ createdAt: -1 });

	return subscriptions;
};

/**
 * Get a single subscription by ID.
 * Admins can fetch any subscription; students only their own.
 *
 * @param {string} subscriptionId
 * @param {Object} requestingUser  - req.user from auth middleware
 * @returns {Promise<Subscription>}
 */
const getSubscriptionById = async (subscriptionId, requestingUser) => {
	const subscription = await Subscription.findById(subscriptionId)
		.populate("planId", "name durationDays price currency")
		.populate("majorId", "name")
		.populate("studentId", "fullName email");

	if (!subscription) {
		throw new ApiError("Subscription not found", 404);
	}

	// Students can only view their own subscription
	const isAdmin = requestingUser.role === "Admin";
	const isOwner =
		subscription.studentId._id.toString() === requestingUser._id.toString();

	if (!isAdmin && !isOwner) {
		throw new ApiError("You are not authorised to view this subscription", 403);
	}

	return subscription;
};
/**
 * Get all subscriptions for the authenticated student.
 *
 * @param {string} studentId
 * @returns {Promise<Subscription[]>}
 */
const getMySubscriptions = async (studentId) => {
	const subscriptions = await Subscription.find({ studentId })
		.populate("planId", "name durationDays price currency")
		.populate("majorId", "name")
		.sort({ createdAt: -1 });

	return subscriptions;
};

/**
 * Cancel an active subscription.
 * Only the owning student may cancel their own subscription.
 * No refund logic is included here — extend as needed.
 *
 * @param {string} subscriptionId
 * @param {string} studentId  - Used to verify ownership
 * @returns {Promise<Subscription>}
 */
const cancelSubscription = async (subscriptionId, studentId) => {
	const subscription = await Subscription.findById(subscriptionId);

	if (!subscription) {
		throw new ApiError("Subscription not found", 404);
	}

	// Ownership check — a student may only cancel their own subscription
	if (subscription.studentId.toString() !== studentId.toString()) {
		throw new ApiError(
			"You are not authorised to cancel this subscription",
			403,
		);
	}

	if (subscription.status !== "active") {
		throw new ApiError(
			`Cannot cancel a subscription with status: ${subscription.status}`,
			400,
		);
	}

	subscription.status = "cancelled";
	await subscription.save();

	return subscription;
};

module.exports = {
	createSubscription,
	getAllSubscriptions,
	getSubscriptionById,
	getMySubscriptions,
	cancelSubscription,
};
