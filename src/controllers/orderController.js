const asyncHandler = require("express-async-handler");
const axios = require("axios");
const mongoose = require("mongoose");

const { getAllDocuments, getDocument } = require("./handlerFactory");
const Model = require("../models/orderModel");
const Transaction = require("../models/transactionsModel");
const Wallet = require("../models/walletModel");
const Offer = require("../models/offerModel");
const ApiError = require("../utils/ApiError");
const { uploadMixOfFiles } = require("../middlewares/uploadFilesMiddleware");
const { createMuxPlaybackTokens } = require("../utils/generateVedioToken");
const sendEmail = require("../utils/sendEmail");
const {
	instructorCreateOrder,
	studentCreateOrder,
} = require("../utils/emailTemplates");

// *********** CREATE AND GET ORDERS **************

// @desc create order
// @route POST api/v1/orders
// @access privet student //DONE
const createOrder = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// 1️⃣ Get accepted offer
		const acceptedOffer = await Offer.findById(req.body.offer)
			.populate({
				path: "request",
				populate: {
					path: "student",
				},
			})
			.populate("instructor")
			.session(session);

		if (!acceptedOffer) {
			throw new ApiError("Offer not found", 404);
		}

		// 2️⃣ Get wallet
		const studentWallet = await Wallet.findOne({
			userId: acceptedOffer.request.student._id,
			userType: "Student",
		}).session(session);

		if (!studentWallet) {
			throw new ApiError("There is no wallet for this user", 404);
		}

		if (studentWallet.balance < acceptedOffer.studentPrice) {
			throw new ApiError(
				"You don't have balance enough to create this order",
				400,
			);
		}

		// 3️⃣ Create Order
		const order = await Model.create(
			[
				{
					student: req.user._id,
					instructor: acceptedOffer.instructor._id,
					studentPrice: acceptedOffer.studentPrice,
					instructorPrice: acceptedOffer.instructorPrice,
					deadline: acceptedOffer.request.deadline,
					instructorCurrency: acceptedOffer.instructorCurrency,
					studentCurrency: acceptedOffer.studentCurrency,
					paidAt: Date.now(),
					startedAt: Date.now(),
					offer: acceptedOffer._id,
				},
			],
			{ session },
		);

		const createdOrder = order[0];

		// 4️⃣ Create Transaction
		await Transaction.create(
			[
				{
					wallet: studentWallet._id,
					type: "debit",
					status: "completed",
					amount: createdOrder.studentPrice,
					reason: "order_create",
					referenceModel: "Order",
					referenceId: createdOrder._id,
					balanceBefore: studentWallet.balance,
					balanceAfter: studentWallet.balance - createdOrder.studentPrice,
				},
			],
			{ session },
		);

		// 5️⃣ Update wallet
		studentWallet.balance -= createdOrder.studentPrice;
		studentWallet.freezedBalance += createdOrder.studentPrice;
		await studentWallet.save({ session });

		// ✅ Commit transaction
		await session.commitTransaction();
		session.endSession();

		// 📧 Send emails AFTER commit (important)
		await sendEmail({
			to: acceptedOffer.student.email,
			subject: "Order Created Successfully 🎉",
			html: studentCreateOrder(
				createdOrder,
				acceptedOffer.request.student.fullName,
			),
		});

		await sendEmail({
			to: acceptedOffer.instructor.email,
			subject: "New Order Assigned 📚",
			html: instructorCreateOrder(
				createdOrder,
				acceptedOffer.instructor.fullName,
			),
		});

		res.status(200).json({
			message: "Order created successfully",
			data: createdOrder,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();

		return next(err);
	}
});

// @desc get all orders
// @route Get api/v1/orders
// @access privet admin //DONE
const getAllOrders = getAllDocuments(Model, Model.modelName);

// @desc get One order
// @route Get api/v1/orders/:id
// @access privet all //DONE
const getOrder = getDocument(Model, Model.modelName);

// @desc get Logged user orders
// @route Get api/v1/orders
// @access privet student-instructor //DONE
const getLoggedUserOrders = asyncHandler(async (req, res, next) => {
	const { user } = req;
	let orders;

	if (user.role === "student") {
		orders = await Model.find({ student: user._id })
			.populate("student", "name email")
			.populate("instructor", "name email");
	} else if (user.role === "instructor") {
		orders = await Model.find({ instructor: user._id })
			.populate("student", "name email")
			.populate("instructor", "name email");
	} else {
		return res.status(403).json({ message: "Unauthorized role" });
	}

	res.status(200).json({
		success: true,
		count: orders.length,
		data: orders,
	});
});

// *********** UPLOAD DOCS **************
const uploadFiles = uploadMixOfFiles([
	{
		name: "documents",
		maxCount: 20,
	},
	{
		name: "quizzes",
		maxCount: 20,
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
	} else if (req.files?.quizzes?.length > 0) {
		// Initialize documents array
		req.body.quizzes = [];

		// Push uploaded file names
		req.files.quizzes.forEach((file) => {
			req.body.quizzes.push(file.filename);
		});
	}

	next();
};

// @desc submit files to order and complete
// @route Get api/v1/orders/:id
// @access privet student-instructor //DONE
const uploadDocs = asyncHandler(async (req, res, next) => {
	//1- get order from id in prams
	const { order } = req; // already fetched in validator

	//2- update order docs
	order.documents = req.body.documents || [];
	await order.save();

	res.status(200).json({
		message: "Documents is uploaded successfully",
		order,
	});
});

// @desc submit quizzes to order and complete
// @route Get api/v1/orders/:id
// @access privet student-instructor //DONE
const uploadQuizzes = asyncHandler(async (req, res, next) => {
	//1- get order from id in prams
	const { order } = req; // already fetched in validator

	//2- update order quizzes
	order.quizzes = req.body.quizzes || [];
	await order.save();

	res.status(200).json({
		message: "Documents is uploaded successfully",
		order,
	});
});

// *********** UPLOAD VIDEOS **************

//@desc get url to upload video on Mux.com
//@route GET /api/v1/orders/createUploadUrl
//@access private instructor //DONE
const getUploadVideoUrl = asyncHandler(async (req, res, next) => {
	const { orderId } = req.params;

	const request = await axios({
		url: "https://api.mux.com/video/v1/uploads",
		method: "post",
		auth: {
			username: process.env.MUX_TOKEN_ID,
			password: process.env.MUX_TOKEN_SECRET,
		},
		data: {
			cors_origin: "*",
			new_asset_settings: {
				playback_policies: ["signed"],
				passthrough: orderId,
				video_quality: "basic",
			},
		},
	});

	res.status(200).json({
		status: "success",
		data: {
			url: request.data.data.url,
			uploadStatus: request.data.data.status,
			id: request.data.data.id,
			offerId: request.data.data.new_asset_settings.passthrough,
			playback_policies: request.data.data.new_asset_settings.playback_policies,
		},
	});
});

//@desc get webhook to success
//@route POST api/v1/orders/mux_webhook //DONE
const handleMuxWebhook = asyncHandler(async (req, res, next) => {
	//check video is related to offer
	// if (!verifyMuxSignature(req)) {
	// 	return next(new ApiError("Invalid signature", 500));
	// // }
	const event = req.body;

	// get offerId from passthrough
	const orderId = event.data?.passthrough;
	if (!orderId) {
		return res.status(400).json({ message: "Missing orderId in passthrough" });
	}

	//check order found
	const order = await Model.findById(orderId);
	if (!order) {
		return next(new ApiError("order not found", 504));
	}

	// update video status
	// prepare new video object from event
	const newVideo = {
		status: "waiting",
		assetId: null,
		playbackId: null,
		duration: null,
		uploadUrl: event.data.passthrough,
		updatedAt: new Date(),
	};

	// update fields based on event type
	switch (event.type) {
		case "video.asset.ready":
			newVideo.status = "ready";
			newVideo.assetId = event.data.id;
			newVideo.playbackId = event.data.playback_ids[0].id;
			newVideo.duration = event.data.duration;
			order.status = "submitted"; // mark order submitted
			break;

		case "video.asset.failed":
			newVideo.status = "failed";
			break;

		case "video.uploading":
			newVideo.status = "processing";
			break;

		default:
			break;
	}

	// push new video to order.videos array
	if (newVideo.status === "ready") {
		order.videos.push(newVideo);
	}

	await order.save();

	return res.status(200).json({ message: "Webhook processed" });
});

//@desc get video with token
//@route GET /api/v1/orders/videos
//@access private all
const getLoggedUserVideos = asyncHandler(async (req, res, next) => {
	//1- get logged student order
	let order;
	const { role } = req.user;
	if (role === "student") {
		order = await Model.findOne({ student: req.user._id });
	} else if (role === "instructor") {
		order = await Model.findOne({ instructor: req.user._id });
	} else {
		return next(new ApiError("غير مصرح لك", 403));
	}

	console.log(order);

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
		data: videos,
	});
});

// *********** FINISH AND COMPLETE **************

//@desc submit and finish order
//@route PUT /api/v1/orders/submit/:id
//@access private instructor
const finishAndSubmitOrder = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { id } = req.params;

		// 1️⃣ get order
		const order = await Model.findById(id).session(session);
		if (!order) {
			throw new ApiError(`No order found for this id ${id}`, 404);
		}

		// 2️⃣ check ownership
		if (order.instructor.toString() !== req.user._id.toString()) {
			throw new ApiError("You don't have permission for this order", 403);
		}

		// 3️⃣ check uploads completed
		if (
			!order.videos ||
			order.videos.length === 0 ||
			!order.documents ||
			order.documents.length === 0 ||
			!order.videos.every((video) => video.status === "ready")
		) {
			throw new ApiError("Videos or documents not uploaded yet", 400);
		}

		// 4️⃣ get wallets
		const studentWallet = await Wallet.findOne({
			userId: order.student,
			userType: "Student",
		}).session(session);

		const instructorWallet = await Wallet.findOne({
			userId: order.instructor,
			userType: "Instructor",
		}).session(session);

		if (!studentWallet || !instructorWallet) {
			throw new ApiError("Wallet not found", 404);
		}

		// 5️⃣ release money (credit instructor)
		const instructorBalanceBefore = instructorWallet.balance;
		instructorWallet.balance += order.instructorPrice;
		await instructorWallet.save({ session });
		studentWallet.freezedBalance -= order.studentPrice;
		await studentWallet.save({ session });

		// 6️⃣ create transaction for instructor
		await Transaction.create(
			[
				{
					wallet: instructorWallet._id,
					type: "credit",
					status: "completed",
					amount: order.instructorPrice,
					reason: "order_completed",
					referenceId: order._id,
					referenceModel: "Order",
					balanceBefore: instructorBalanceBefore,
					balanceAfter: instructorWallet.balance,
				},
			],
			{ session },
		);

		// 7️⃣ update order
		order.status = "completed";
		order.paymentStatus = "released";
		order.completedAt = Date.now();

		await order.save({ session });

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			message: "Order completed and payment released successfully",
			data: order,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		return next(error);
	}
});

// *********** DELETE AND CANCEL ORDERS **************

//@desc cancel order
//@route PUT /api/v1/orders/cancel/:id
//@access private student
const cancelOrder = asyncHandler(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { id } = req.params;

		// 1️⃣ get order
		const order = await Model.findById(id).session(session);
		if (!order) {
			throw new ApiError("No order found with this id", 404);
		}

		// 2️⃣ check ownership (only student)
		if (order.student.toString() !== req.user._id.toString()) {
			throw new ApiError("ليس لديك صلاحية لإلغاء هذا الطلب", 403);
		}

		// 3️⃣ prevent cancel if completed
		if (order.status === "completed") {
			throw new ApiError("لا يمكن إلغاء طلب مكتمل", 400);
		}

		// 4️⃣ get student wallet
		const studentWallet = await Wallet.findOne({
			userId: order.student,
			userType: "Student",
		}).session(session);

		if (!studentWallet) {
			throw new ApiError("محفظة الطالب غير موجودة", 404);
		}

		// 5️⃣ refund money
		const balanceBefore = studentWallet.balance;

		studentWallet.balance += order.studentPrice;
		studentWallet.freezedBalance -= order.studentPrice;

		await studentWallet.save({ session });

		// 6️⃣ create refund transaction
		await Transaction.create(
			[
				{
					wallet: studentWallet._id,
					type: "credit",
					status: "completed",
					amount: order.studentPrice,
					reason: "order_cancelled",
					referenceId: order._id,
					referenceModel: "Order",
					balanceBefore,
					balanceAfter: studentWallet.balance,
				},
			],
			{ session },
		);

		// 7️⃣ update order
		order.status = "cancelled";
		order.paymentStatus = "refunded";
		order.cancelledAt = Date.now();

		await order.save({ session });

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			message: "تم إلغاء الطلب واسترجاع المبلغ بنجاح",
			data: order,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		return next(err);
	}
});

//@desc delete order (soft delete)
//@route DELETE /api/v1/orders/:id
//@access private admin
const deleteOrder = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const order = await Model.findById(id);
	if (!order) {
		return next(new ApiError("لا يوجد طلب بهذا الرقم", 404));
	}

	order.isDeleted = true;
	await order.save();

	res.status(200).json({
		message: "تم حذف الطلب بنجاح",
	});
});

module.exports = {
	createOrder,
	getAllOrders,
	getOrder,
	getLoggedUserOrders,
	uploadDocs,
	uploadQuizzes,
	getUploadVideoUrl,
	handleMuxWebhook,
	finishAndSubmitOrder,
	fileLocalUpdate,
	uploadFiles,
	getLoggedUserVideos,
	cancelOrder,
	deleteOrder,
};
