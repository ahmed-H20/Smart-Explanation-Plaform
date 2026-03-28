const crypto = require("crypto");

const uuid = crypto.randomUUID();

const { default: mongoose } = require("mongoose");
const asyncHandler = require("express-async-handler");

const Request = require("../models/requestModel");
const Instructor = require("../models/instructorsModel");
const Offer = require("../models/offerModel");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionsModel");

const ApiError = require("../utils/ApiError");
const { addEmailJob } = require("../queues/email/emailQueue");
const { uploadMixOfFiles } = require("../middlewares/uploadFilesMiddleware");
const { createMuxPlaybackTokens } = require("../utils/generateVedioToken");

// @desc create new Assignment Request
// @route POST /api/v1/assignments/createRequests
// @access private student
const createRequest = asyncHandler(async (req, res, next) => {
	// 1- create request
	const request = await Request.create({
		...req.body,
		type: "assignment",
		student: req.user._id,
	});

	await request.populate({
		path: "student",
		select: "country",
		populate: {
			path: "country",
			select: "currencyCode",
		},
	});

	// 2- res
	res.status(200).json({
		message: "Assignment request created",
	});

	// 3- send emails to all users by queue
	// get all instructors
	const instructors = await Instructor.find();

	// create jobs
	await Promise.all(
		instructors.map((instructor) =>
			addEmailJob({ instructor, request }, "newAssignment"),
		),
	);
});

// @desc Accept request
// @route PUT /api/v1/assignments/:id/accept
// @access private instructor
const acceptAssignmentRequest = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { request } = req;

		// Create mongo IDs
		const offerId = new mongoose.Types.ObjectId();
		const orderId = new mongoose.Types.ObjectId();

		// Edit student balance
		const balanceBefore = request.student.wallet.balance;
		await Wallet.findByIdAndUpdate(
			request.student.wallet._id,
			{ $inc: { balance: -request.budget } },
			{ session },
		);

		// 3️⃣ Create Offer and update wallet in parallel
		const [offerArray, orderArray, transactionArray] = await Promise.all([
			Offer.create(
				[
					{
						_id: offerId,
						request: request._id,
						instructor: req.user._id,
						status: "accepted",
						studentCurrency: request.student.country.currencyCode,
						instructorCurrency: req.user.country.currencyCode,
					},
				],
				{ session },
			),
			Order.create(
				[
					{
						offer: offerId, // required reference
						student: request.student._id,
						instructor: req.user._id,
						studentPrice: request.budget,
						instructorPrice: request.budget,
						deadline: request.deadline,
						studentCurrency: request.student.country.currencyCode,
						instructorCurrency: req.user.country.currencyCode,
						paidAt: Date.now(),
						startedAt: Date.now(),
					},
				],
				{ session },
			),
			Transaction.create(
				[
					{
						wallet: request.student.wallet._id,
						type: "debit",
						amount: request.budget,
						status: "completed",
						reason: "order_create",
						balanceBefore,
						balanceAfter: request.student.wallet.balance,
						referenceModel: "Order",
						referenceId: orderId,
					},
				],
				{ session },
			),
		]);

		const order = orderArray[0];

		// 6️⃣ Commit transaction
		await session.commitTransaction();
		session.endSession();

		// 7️⃣ Send response
		res.status(201).json({
			message: "Request accepted successfully",
			order,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		next(err);
	}
});

// *********** UPLOAD DOCS **************
const uploadFiles = uploadMixOfFiles([
	{
		name: "documents",
		maxCount: 3,
	},
]);

const fileLocalUpdate = (req, res, next) => {
	// Check if documents were uploaded
	if (req.files?.documents?.length > 0) {
		// Initialize documents array
		req.body.documents = [];

		// Push uploaded file names
		req.files.documents.forEach((file) => {
			req.body.documents.push(file.filename);
		});
	}

	next();
};

// @desc Upload Solve Pdf
// @route PUT /api/v1/assignments/:id/uploadPdf
// @access private instructor
const uploadSolvedPdf = asyncHandler(async (req, res, next) => {
	//1- get order from id in prams
	const { order } = req; // already fetched in validator

	//2- update order docs
	order.documents = req.body.documents || [];
	await order.save();

	res.status(200).json({
		message: "Solution file is uploaded successfully",
		order,
	});
});

//@desc get solution of assignment
//@route GET /api/v1/orders/solution
//@access private all
const getLoggedUserSolution = asyncHandler(async (req, res, next) => {
	//1- get logged student order

	const { order } = req;
	const { id } = req.params;
	const { role } = req.user;

	//2- process videos
	let videos = [];
	if (order.videos && order.videos.length > 0) {
		// Generate playback tokens for all videos in parallel
		const results = await Promise.all(
			order.videos.map((video) => createMuxPlaybackTokens(video.playbackId)),
		);

		videos = results.filter(Boolean);
	}

	//3- res
	res.status(200).json({
		status: "success",
		numberOfVideos: videos.length,
		data: { videos: videos, solutionFiles: order.documents },
	});
});

// @desc Approval of the request and transfer money
// @route PUT /api/v1/assignments/:id/requestApproval
// @access private student
const approveAssignmentSolution = asyncHandler(async (req, res, next) => {
	const { order } = req;

	try {
		await mongoose.connection.transaction(async (session) => {
			// get wallets inside transaction
			const studentWallet = await Wallet.findById(
				order.student.wallet._id,
			).session(session);

			const instructorWallet = await Wallet.findOne({
				userId: order.instructor._id,
			}).session(session);

			if (!studentWallet || !instructorWallet) {
				throw new ApiError("Wallet not found", 404);
			}

			if (studentWallet.balance < order.studentPrice) {
				throw new ApiError("Student balance is insufficient", 400);
			}

			const studentBalanceBefore = studentWallet.balance;
			const instructorBalanceBefore = instructorWallet.balance;

			const studentBalanceAfter = studentBalanceBefore - order.studentPrice;
			const instructorBalanceAfter =
				instructorBalanceBefore + order.instructorPrice;

			// atomic balance update
			await Wallet.updateOne(
				{ _id: studentWallet._id },
				{ $inc: { balance: -order.studentPrice } },
				{ session },
			);

			await Wallet.updateOne(
				{ _id: instructorWallet._id },
				{ $inc: { balance: order.instructorPrice } },
				{ session },
			);

			// create wallet transactions
			await Transaction.insertMany(
				[
					{
						wallet: studentWallet._id,
						type: "debit",
						amount: order.studentPrice,
						reason: "order_payment",
						status: "completed",
						balanceBefore: studentBalanceBefore,
						balanceAfter: studentBalanceAfter,
						referenceModel: "Order",
						referenceId: order._id,
					},
					{
						wallet: instructorWallet._id,
						type: "credit",
						amount: order.instructorPrice,
						reason: "order_payment",
						status: "completed",
						balanceBefore: instructorBalanceBefore,
						balanceAfter: instructorBalanceAfter,
						referenceModel: "Order",
						referenceId: order._id,
					},
				],
				{ session },
			);

			// update order
			order.status = "approved";
			order.approvedAt = new Date();

			await order.save({ session });
		});

		res.status(200).json({
			status: "success",
			message: "Solution approved and payment transferred to instructor",
			order,
		});
	} catch (err) {
		next(err);
	}
});

// @desc meeting request
// @route PUT /api/v1/assignments/:id/requestMeeting
// @access private student
const requestAssignmentMeeting = asyncHandler(async (req, res, next) => {
	const { order } = req;

	console.log(order);

	if (order.status !== "submitted") {
		return next(
			new ApiError(
				"Meeting can only be requested after solution submission",
				400,
			),
		);
	}

	order.status = "meeting_requested";

	await order.save();

	res.status(200).json({
		status: "success",
		message: "Meeting requested successfully",
	});
});

// @desc Create meeting to understand
// @route PUT /api/v1/assignments/:id/notUnderstand
// @access private instructor
const scheduleAssignmentMeeting = asyncHandler(async (req, res, next) => {
	const { order } = req;
	const { time } = req.body;

	if (order.status !== "meeting_requested") {
		return next(new ApiError("Meeting was not requested for this order", 400));
	}

	// generate unique room name
	const randomString = crypto.randomBytes(6).toString("hex");
	const roomName = `assignment-${order._id}-${randomString}`;

	// public jitsi link
	const meetingLink = `https://meet.jit.si/${roomName}`;

	order.AssignmentMeeting = {
		link: meetingLink,
		time: new Date(time),
	};

	order.status = "meeting_scheduled";

	await order.save();

	res.status(200).json({
		status: "success",
		message: "Meeting scheduled successfully",
		data: order.AssignmentMeeting,
	});
});

module.exports = {
	createRequest,
	acceptAssignmentRequest,
	uploadFiles,
	fileLocalUpdate,
	uploadSolvedPdf,
	getLoggedUserSolution,
	approveAssignmentSolution,
	requestAssignmentMeeting,
	scheduleAssignmentMeeting,
};
