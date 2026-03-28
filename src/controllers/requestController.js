const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const Subscription = require("../models/subscriptionModel");
const instructorModel = require("../models/instructorsModel");
const Wallet = require("../models/walletModel");
const Offer = require("../models/offerModel");
const Order = require("../models/orderModel");
const Transaction = require("../models/transactionsModel");
const {
	createDocument,
	getAllDocuments,
	getDocument,
} = require("./handlerFactory");
const Model = require("../models/requestModel");
const ApiError = require("../utils/ApiError");
const { uploadMixOfFiles } = require("../middlewares/uploadFilesMiddleware");
const { addEmailJob } = require("../queues/email/emailQueue");

const uploadFiles = uploadMixOfFiles([
	{
		name: "demoFiles",
		maxCount: 5,
	},
	{
		name: "allFiles",
		maxCount: 30,
	},
]);

const fileLocalUpdate = (req, res, next) => {
	// Save image into db
	if (req.files && req.files.demoFiles && req.files.demoFiles.length > 0) {
		if (!req.body.demoFiles) req.body.demoFiles = [];
		req.files.demoFiles.map((file, index) =>
			// Save image into db
			req.body.demoFiles.push(file.filename),
		);
	}

	if (req.files && req.files.allFiles && req.files.allFiles.length > 0) {
		if (!req.body.allFiles) req.body.files = [];
		req.files.allFiles.map((file, index) =>
			// Save image into db
			req.body.files.push(file.filename),
		);
	}
	next();
};

// @desc get student ID from logged user
const getStudentId = asyncHandler(async (req, res, next) => {
	req.body.student = req.user._id;
	next();
});

// @desc get logged user Request
// @route GET api/v1/requests/me
// @access private student //DONE
const getLoggedStudentRequests = asyncHandler(async (req, res, next) => {
	const studentId = req.user._id;

	const requests = await Model.find({ student: studentId, isDeleted: false });
	if (!requests) {
		return next(
			new ApiError(`There is no requests for this student: ${studentId}`, 504),
		);
	}

	res.status(200).json({
		status: "success",
		numberOfRequests: requests.length,
		data: requests,
	});
});

// @desc create new Request
// @route POST /api/v1/Requests
// @access private student //DONE
const createRequest = createDocument(Model, Model.modelName);

// @desc get all Requests
// @route GET /api/v1/Requests
// @access private student-instructor //DONE
const getAllRequest = getAllDocuments(Model, Model.modelName);

// @desc get one Request
// @route GET /api/v1/Requests/:id
// @access private student-admin //DONE
const getRequestById = getDocument(Model, Model.modelName);

// @desc update one Request
// @route PUT /api/v1/Requests/:id
// @access private student //DONE
const updateRequest = asyncHandler(async (req, res, next) => {
	const request = req.requestDoc;

	Object.assign(request, req.body);

	await request.save();

	res.status(200).json({
		message: `request is Updated`,
		data: request,
	});
});

// @desc delete one Request
// @route DELETE /api/v1/Requests/:id
// @access private admin //DONE
const deleteRequest = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const request = await Model.findByIdAndUpdate(
		id,
		{
			isDeleted: true,
		},
		{ new: true },
	);

	res.status(200).json({
		message: "request is deleted",
		data: request,
	});
});

// @desc change request status
// @route PATCH /api/v1/requests/:id/status
// @access private admin //DONE
const changeRequestStatus = asyncHandler(async (req, res, next) => {
	const requestId = req.params.id;
	const request = await Model.findByIdAndUpdate(
		requestId,
		{
			status: req.body.status,
		},
		{ new: true },
	);
	if (!request) {
		return next(new ApiError("Cannot find this request"));
	}

	res.status(200).json({
		message: "status updated",
		data: request,
	});
});

// @desc change request status
// @route PATCH /api/v1/requests/:id/cancel
// @access private student //DONE
const cancelRequest = asyncHandler(async (req, res, next) => {
	const request = req.requestDoc;

	console.log("cancel: ", request);

	request.status = "cancelled";

	await request.save();

	res.status(200).json({
		message: "request canceled",
		data: request,
	});
});

/*
 * @desc Create direct request to accept immediately without demo videos
 * @route POST /api/v1/requests/createDirectRequest
 * @access private student
 */
const createDirectRequest = asyncHandler(async (req, res, next) => {
	// 1- get request data from body
	const requestBody = req.body;

	// 2- create new request with data and type and budget
	const directRequest = await Model.create({
		...requestBody,
		student: req.user._id,
		creationType: "directAccept",
		status: "open",
	});
	if (!directRequest) {
		return next(
			new ApiError(
				"Cannot create request now, repeat again in few minutes",
				500,
			),
		);
	}

	// 3- send res
	res.status(200).json({
		message: "Direct Request create succfully✅",
		data: directRequest,
	});

	// Get all instructors
	const instructors = await instructorModel.find();

	await directRequest.populate({
		path: "student",
		select: "country",
		populate: {
			path: "country",
			select: "currencyCode",
		},
	});

	//4- send email to all instructors with worker (email queue)
	await Promise.all(
		instructors.map((instructor) =>
			addEmailJob({ instructor, directRequest }, "newDirectRequest"),
		),
	);
});

// /**
//  * @desc Accept direct request by instructor
//  * @route PUT /api/v1/requests/:id/acceptDirect
//  * @access private instructor
//  */
// const acceptDirectRequest = asyncHandler(async (req, res, next) => {
// 	const request = req.requestDoc;
// 	const { student } = request;

// 	// ── 1. ALL reads happen before session opens ───────────────────
// 	const activeSubscription = await Subscription.findOne({
// 		student: student._id,
// 		major: request.major,
// 		status: "active",
// 		endDate: { $gte: new Date() },
// 	});

// 	const isCoveredBySubscription = !!activeSubscription;

// 	// ── 2. Fast fail before session opens ─────────────────────────
// 	if (!isCoveredBySubscription && student.wallet.balance < request.budget) {
// 		return next(new ApiError("Student has insufficient balance", 400));
// 	}

// 	// ── 3. Pre-generate IDs before session ─────────────────────────
// 	const offerId = new mongoose.Types.ObjectId();
// 	const orderId = new mongoose.Types.ObjectId();
// 	const balanceBefore = student.wallet.balance;

// 	console.log(
// 		"Topology:",
// 		mongoose.connection.client.topology?.description?.type,
// 	);
// 	// ── 4. Open session as LATE as possible ────────────────────────
// 	const session = await mongoose.startSession();

// 	try {
// 		session.startTransaction({
// 			readConcern: { level: "snapshot" },
// 			writeConcern: { w: "majority" },
// 			maxTimeMS: 10000, // kill transaction after 10s instead of Atlas default 60s
// 		});

// 		// ── 5. Atomic claim ────────────────────────────────────────
// 		const claimed = await Model.findOneAndUpdate(
// 			{ _id: request._id, status: "open" },
// 			{ $set: { status: "completed" } },
// 			{ session, new: true },
// 		);

// 		if (!claimed) {
// 			await session.abortTransaction();
// 			session.endSession();
// 			return next(
// 				new ApiError(
// 					"This request has already been accepted by another instructor",
// 					409,
// 				),
// 			);
// 		}

// 		// ── 6. Wallet deduction ────────────────────────────────────
// 		if (!isCoveredBySubscription) {
// 			await Wallet.findByIdAndUpdate(
// 				student.wallet._id,
// 				{ $inc: { balance: -request.budget } },
// 				{ session },
// 			);
// 		}

// 		// ── 7. All writes in parallel ──────────────────────────────
// 		const dbOperations = [
// 			Offer.create(
// 				[
// 					{
// 						_id: offerId,
// 						request: request._id,
// 						instructor: req.user._id,
// 						status: "accepted",
// 						studentCurrency: student.country.currencyCode,
// 						instructorCurrency: req.user.country.currencyCode,
// 					},
// 				],
// 				{ session },
// 			),
// 			Order.create(
// 				[
// 					{
// 						_id: orderId,
// 						offer: offerId,
// 						student: student._id,
// 						instructor: req.user._id,
// 						studentPrice: isCoveredBySubscription ? 0 : request.budget,
// 						instructorPrice: request.budget,
// 						deadline: request.deadline,
// 						studentCurrency: student.country.currencyCode,
// 						instructorCurrency: req.user.country.currencyCode,
// 						paidAt: Date.now(),
// 						startedAt: Date.now(),
// 						paidBySubscription: isCoveredBySubscription,
// 						subscription: activeSubscription?._id ?? null,
// 					},
// 				],
// 				{ session },
// 			),
// 		];

// 		if (!isCoveredBySubscription) {
// 			dbOperations.push(
// 				Transaction.create(
// 					[
// 						{
// 							wallet: student.wallet._id,
// 							type: "debit",
// 							amount: request.budget,
// 							status: "completed",
// 							reason: "order_create",
// 							balanceBefore,
// 							balanceAfter: balanceBefore - request.budget,
// 							referenceModel: "Order",
// 							referenceId: orderId,
// 						},
// 					],
// 					{ session },
// 				),
// 			);
// 		}

// 		const [, orderArray] = await Promise.all(dbOperations);
// 		const order = orderArray[0];

// 		// ── 8. Commit ──────────────────────────────────────────────
// 		await session.commitTransaction();
// 		session.endSession();

// 		// ── 9. Response ────────────────────────────────────────────
// 		res.status(201).json({
// 			message: isCoveredBySubscription
// 				? "Direct request accepted via subscription ✅"
// 				: "Direct request accepted successfully ✅",
// 			paidBySubscription: isCoveredBySubscription,
// 			order,
// 		});

// 		// ── 10. Fire and forget email ──────────────────────────────
// 		addEmailJob(
// 			{
// 				instructor: req.user,
// 				student,
// 				request,
// 				order,
// 				isCoveredBySubscription,
// 			},
// 			"directRequestAccepted",
// 		).catch((err) => console.error("Email job failed:", err));
// 	} catch (err) {
// 		if (session.inTransaction()) {
// 			await session.abortTransaction();
// 		}
// 		session.endSession();
// 		next(err);
// 	}
// });

module.exports = {
	createRequest,
	getAllRequest,
	getRequestById,
	updateRequest,
	deleteRequest,
	changeRequestStatus,
	getStudentId,
	fileLocalUpdate,
	cancelRequest,
	getLoggedStudentRequests,
	uploadFiles,
	createDirectRequest,
	// acceptDirectRequest,
};
