const asyncHandler = require("express-async-handler");
const axios = require("axios");
const mongoose = require("mongoose");

const { getAllDocuments, getDocument } = require("./handlerFactory");
const Model = require("../models/orderModel");
const Transaction = require("../models/transactionsModel");
const Wallet = require("../models/walletModel");
const Subscription = require("../models/subscriptionModel");
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
		// 1️⃣ Get accepted offer — populate request (student + major)
		const acceptedOffer = await Offer.findById(req.body.offer)
			.populate({
				path: "request",
				populate: [{ path: "student" }, { path: "major" }],
			})
			.populate("instructor")
			.session(session);

		if (!acceptedOffer) {
			throw new ApiError("Offer not found", 404);
		}

		const { student, major } = acceptedOffer.request;

		if (!major) {
			throw new ApiError(
				"Request has no major attached — cannot process order",
				400,
			);
		}

		// 2️⃣ Subscription check
		//
		// Three possible states:
		//
		//  A) Student has NO subscription for this major at all
		//     (never subscribed, or only has subscriptions for other majors)
		//     → ALLOWED: pay directly from wallet, no subscription needed
		//
		//  B) Student HAS a subscription for this major but it is inactive
		//     (status = "cancelled" | "expired", OR endDate has passed)
		//     → BLOCKED: must renew subscription before placing an order
		//
		//  C) Student HAS an active, non-expired subscription for this major
		//     → ALLOWED: proceed normally, wallet payment still applies
		//
		// This design lets unsubscribed students use the platform freely,
		// but once a student has ever subscribed to a major and that subscription
		// lapses, they must renew — they cannot fall back to the "no subscription" path.

		// Look for ANY subscription (any status) for this student + major
		const anySubscription = await Subscription.findOne({
			studentId: student._id,
			majorId: major._id,
		}).session(session);

		if (anySubscription) {
			// Student has/had a subscription for this major — enforce its status
			const isActive =
				anySubscription.status === "active" &&
				anySubscription.endDate > new Date(); // runtime expiry guard

			if (!isActive) {
				// Determine a clear reason for the block
				const reason =
					anySubscription.endDate <= new Date()
						? "Your subscription for this major has expired. Please renew to continue placing orders."
						: "Your subscription for this major is no longer active. Please subscribe again to place orders.";

				throw new ApiError(reason, 403);
			}
			// else: active subscription — fall through and allow the order
		}
		// else: no subscription at all for this major — allow direct wallet payment

		// 3️⃣ Get and validate wallet
		const studentWallet = await Wallet.findOne({
			userId: student._id,
			userType: "Student",
		}).session(session);

		if (!studentWallet) {
			throw new ApiError("There is no wallet for this user", 404);
		}

		if (studentWallet.isLocked) {
			throw new ApiError("Your wallet is locked. Please contact support.", 403);
		}

		if (studentWallet.balanceUSD < acceptedOffer.priceUSD) {
			throw new ApiError(
				"You don't have enough balance to create this order",
				400,
			);
		}

		// 4️⃣ Create Order
		// Store subscription ref only when one was involved (for audit trail)
		const orderPayload = {
			student: req.user._id,
			instructor: acceptedOffer.instructor._id,
			studentPriceUSD: acceptedOffer.priceUSD,
			instructorPriceUSD: acceptedOffer.instructorEarningUSD,
			deadline: acceptedOffer.request.deadline,
			paidAt: Date.now(),
			startedAt: Date.now(),
			offer: acceptedOffer._id,
		};

		const order = await Model.create([orderPayload], { session });
		const createdOrder = order[0];

		// 5️⃣ Create debit Transaction
		await Transaction.create(
			[
				{
					wallet: studentWallet._id,
					type: "debit",
					status: "completed",
					amountUSD: createdOrder.studentPriceUSD,
					reason: "order_create",
					referenceModel: "Order",
					referenceId: createdOrder._id,
					balanceBeforeUSD: studentWallet.balanceUSD,
					balanceAfterUSD:
						studentWallet.balanceUSD - createdOrder.studentPriceUSD,
				},
			],
			{ session },
		);

		// 6️⃣ Deduct balance and freeze the order amount
		studentWallet.balanceUSD -= createdOrder.studentPriceUSD;
		studentWallet.freezedBalanceUSD += createdOrder.studentPriceUSD;
		await studentWallet.save({ session });

		// ✅ Commit
		await session.commitTransaction();
		session.endSession();

		// 📧 Send emails AFTER commit (must never block or roll back the transaction)
		await sendEmail({
			to: student.email,
			subject: "Order Created Successfully 🎉",
			html: studentCreateOrder(createdOrder, student.fullName),
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
//@access private instructor
const getUploadVideoUrl = asyncHandler(async (req, res, next) => {
	const { orderId } = req.params;

	let request;
	try {
		request = await axios({
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
	} catch (err) {
		console.log(err.response.data);
		throw new Error(`${err.response.data.error.messages[0]}`);
	}

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
	const event = req.body;

	// 1️⃣ get orderId
	const orderId = event.data?.passthrough;
	if (!orderId) {
		return res.status(400).json({ message: "Missing orderId in passthrough" });
	}

	// 2️⃣ prepare video object
	let newVideo = {
		status: "waiting",
		assetId: null,
		playbackId: null,
		duration: null,
		uploadUrl: orderId,
		updatedAt: new Date(),
	};

	// 3️⃣ handle event types
	switch (event.type) {
		case "video.asset.ready":
			newVideo = {
				...newVideo,
				status: "ready",
				assetId: event.data.id,
				playbackId: event.data.playback_ids?.[0]?.id || null,
				duration: event.data.duration,
			};
			break;

		case "video.asset.failed":
			newVideo.status = "failed";
			break;

		case "video.uploading":
			newVideo.status = "processing";
			break;

		default:
			return res.status(200).json({ message: "Event ignored" });
	}

	// 4️⃣ update DB (atomic + no duplicates)
	const updateQuery = {
		$push: { videos: newVideo },
	};

	// لو الفيديو ready → حدث حالة الأوردر
	if (newVideo.status === "ready") {
		updateQuery.$set = { status: "submitted" };
	}

	// 5️⃣ prevent duplicates باستخدام assetId
	const filter = { _id: orderId };

	if (newVideo.assetId) {
		filter["videos.assetId"] = { $ne: newVideo.assetId };
	}

	const result = await Model.updateOne(filter, updateQuery);

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
		const instructorBalanceBefore = instructorWallet.balanceUSD;
		instructorWallet.balanceUSD += order.instructorPriceUSD;
		await instructorWallet.save({ session });
		studentWallet.freezedBalanceUSD -= order.studentPriceUSD;
		await studentWallet.save({ session });

		// 6️⃣ create transaction for instructor
		await Transaction.create(
			[
				{
					wallet: instructorWallet._id,
					type: "credit",
					status: "completed",
					amountUSD: order.instructorPriceUSD,
					reason: "order_completed",
					referenceId: order._id,
					referenceModel: "Order",
					balanceBeforeUSD: instructorBalanceBefore,
					balanceAfterUSD: instructorWallet.balanceUSD,
				},
			],
			{ session },
		);

		// 7️⃣ update order
		order.status = "completed";
		order.paymentStatus = "released";
		order.completedAt = Date.now();
		order.platformProfit = order.studentPriceUSD - order.instructorPriceUSD;

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
