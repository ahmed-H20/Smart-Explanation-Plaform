const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const axios = require("axios");

const { getAllDocuments, updateDocument } = require("./handlerFactory");
const Model = require("../models/offerModel");
const ApiError = require("../utils/ApiError");

const { uploadMixOfFiles } = require("../middlewares/uploadFilesMiddleware");
const { createMuxPlaybackTokens } = require("../utils/generateVedioToken");

const uploadFiles = uploadMixOfFiles([
	{
		name: "allFiles",
		maxCount: 20,
	},
]);

const fileLocalUpdate = (req, res, next) => {
	// Save image into db

	if (req.files && req.files.allFiles && req.files.allFiles.length > 0) {
		if (!req.body.allFiles) req.body.allFiles = [];
		req.files.allFiles.map((file, index) =>
			// Save image into db
			req.body.allFiles.push(file.filename),
		);
	}
	next();
};

const verifyMuxSignature = (req) => {
	const secret = process.env.MUX_WEBHOOK_SECRET;

	console.log(secret);

	const signatureHeader = req.headers["mux-signature"];

	const parts = signatureHeader.split(",");
	const signature = parts.find((p) => p.startsWith("v1="))?.replace("v1=", "");

	const hash = crypto
		.createHmac("sha256", secret)
		.update(req.body) // raw body
		.digest("hex");

	console.log("hash: ", hash);

	console.log("signature: ", signature);

	return hash === signature;
};

//@desc get url to upload video on Mux.com
//@route /api/v1/offers/createUploadUrl
//@access private instructor
const getUploadVideoUrl = asyncHandler(async (req, res, next) => {
	const { offerId } = req.params;

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
				passthrough: offerId,
				video_quality: "basic",
			},
		},
	});

	const offer = await Model.findByIdAndUpdate(
		offerId,
		{
			demoVideo: {
				uploadUrl: request.data.data.url,
				status: "waiting",
			},
		},
		{ new: true },
	);

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

/*
 data: {
      video_quality: 'basic',
      upload_id: '7xNsFVBv3BLBjEBWiNVy8DA2a869hQPlg00qIzAJIa02Y',
      tracks: [Array],
      status: 'ready',
      resolution_tier: '720p',
      progress: [Object],
      playback_ids: [Array],
      mp4_support: 'none',
      max_stored_resolution: 'SD',
      max_stored_frame_rate: 30,
      max_resolution_tier: '1080p',
      master_access: 'none',
      ingest_type: 'on_demand_direct_upload',
      id: '7uZKqgULYdRy9h4fHqW9ptympOmh7oMMeiLmowl3iZw',
      encoding_tier: 'baseline',
      duration: 30.033333,
      created_at: 1771395610,
      aspect_ratio: '16:9'
    },
*/

// webhook to success
const handleMuxWebhook = asyncHandler(async (req, res, next) => {
	//check video is related to offer
	// if (!verifyMuxSignature(req)) {
	// 	return next(new ApiError("Invalid signature", 500));
	// // }
	console.log(req);

	const event = req.body;

	// get offerId from passthrough
	const offerId = event.data?.passthrough;
	if (!offerId) {
		return res.status(400).json({ message: "Missing offerId in passthrough" });
	}

	//check offer found
	const offer = await Model.findById(offerId);
	if (!offer) {
		return next(new ApiError("Offer not found", 504));
	}

	// update video status
	switch (event.type) {
		case "video.asset.ready":
			offer.demoVideo.status = "ready";
			offer.demoVideo.assetId = event.data.id;
			offer.demoVideo.playbackId = event.data.playback_ids[0].id;
			offer.demoVideo.duration = event.data.duration;
			offer.demoVideo.updatedAt = new Date();
			offer.status = "pending";
			break;

		case "video.asset.failed":
			offer.demoVideo.status = "failed";
			offer.demoVideo.assetId = null;
			offer.demoVideo.updatedAt = new Date();
			break;

		case "video.uploading":
			offer.demoVideo.status = "processing";
			offer.demoVideo.updatedAt = new Date();
			break;

		default:
			break;
	}

	await offer.save();

	return res.status(200).json({ message: "Webhook processed" });
});

// @desc create offer
// @route POST api/v1/offers
// @access privet instructor //DONE
const createOffer = asyncHandler(async (req, res) => {
	const offer = await Model.create({
		request: req.body.request,
		instructor: req.user._id,
		// demoVideo: {
		// 	uploadUrl: req.body.demoVideo.uploadUrl,
		// 	status: "waiting",
		// },
	});

	res.status(201).json({
		message: "Offer created successfully",
		offer,
	});
});

// @desc get all offers for admin
// @route Get api/v1/offers
// @access privet instructor //DONE
const getAllOffers = getAllDocuments(Model, Model.modelName);

// @desc get all offers for logged instructor
// @route Get api/v1/offers/me
// @access privet instructor //DONE
const getLoggedInstructorOffers = asyncHandler(async (req, res, next) => {
	const instructorId = req.user._id;

	const offers = await Model.find({ instructor: instructorId });

	res.status(200).json({
		message: "success",
		numberOfOffers: offers.length,
		data: offers,
	});
});

// @desc get all offers for request
// @route Get api/v1/offers/:requestId
// @access privet instructor-student//DONE
const getOffersForRequest = asyncHandler(async (req, res, next) => {
	const { requestId } = req.params;

	const requests = await Model.find({
		request: requestId,
		status: { $ne: "cancelled" },
	});
	if (requests.length === 0) {
		return next(new ApiError("cant find offer for this user", 504));
	}

	res.status(200).json({
		message: "success",
		numberOfRequests: requests.length,
		data: requests,
	});
});

// @desc get one offers by id
// @route Get api/v1/offers/:id
// @access privet instructor-student//DONE
const getOffer = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const offer = await Model.findById(id);
	if (!offer) {
		return next(
			new ApiError(`cannot find ${Model.modelName} with id : ${id}`, 404),
		);
	}

	let videoLinks;
	if (offer.demoVideo.playbackId) {
		videoLinks = await createMuxPlaybackTokens(offer.demoVideo.playbackId);
	}

	console.log(offer);

	res.status(200).json({ data: offer, videoLinks: videoLinks });
});

// @desc update one offers by id
// @route PATCH api/v1/offers/:id
// @access privet instructor
const updateOffer = updateDocument(Model, Model.modelName);

// @desc delete one offers by id
// @route DELETE api/v1/offers/:id
// @access privet admin //DONE
const deleteOffer = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const request = await Model.findByIdAndUpdate(
		id,
		{
			isDeleted: true,
		},
		{ new: true },
	);

	res.status(200).json({
		message: `offer:${id} is deleted`,
	});
});

// @desc cancel one offers by id
// @route PATCH api/v1/offers/cancel/:id
// @access privet instructor //DONE
const cancelOffer = asyncHandler(async (req, res, next) => {
	const offer = req.offerDoc;

	console.log(offer);

	offer.status = "cancelled";

	await offer.save();

	res.status(200).json({
		message: "offer canceled",
		data: offer,
	});
});

// @desc accept one offers by id
// @route PATCH api/v1/offers/:id/accept
// @access privet student //DONE
const acceptOffer = asyncHandler(async (req, res, next) => {
	const { offer } = req; // already fetched in validator

	await Model.updateMany(
		{ request: offer.request._id, _id: { $ne: offer._id } },
		{ $set: { status: "rejected" } },
	);

	offer.status = "accepted";
	offer.allFiles = req.body.allFiles || [];
	await offer.save();

	res.status(200).json({
		message: "Offer accepted",
		offer,
	});
});

// @desc Set offer price
// @route PATCH api/v1/offers/:id/estimatedTimeAndPrice
// @access privet instructor
const setEstimatedTimeAndPrice = asyncHandler(async (req, res, next) => {
	const { estimatedTime } = req.body;

	const offer = req.offerDoc;

	const studentPrice =
		offer.studentCurrency === "SAR" ? estimatedTime * 40 : estimatedTime * 200;

	const instructorPrice =
		offer.instructorCurrency === "SAR"
			? estimatedTime * 40
			: estimatedTime * 200;

	offer.instructorPrice = instructorPrice;
	offer.studentPrice = studentPrice;
	offer.estimatedTime = estimatedTime;

	await offer.save();

	res.status(200).json({ message: "offer price set", offer: offer });
});
// 1 hour -> 40SA -> 200LE

// create order

module.exports = {
	getUploadVideoUrl,
	handleMuxWebhook,
	createOffer,
	getAllOffers,
	getLoggedInstructorOffers,
	getOffersForRequest,
	getOffer,
	updateOffer,
	deleteOffer,
	cancelOffer,
	acceptOffer,
	uploadFiles,
	fileLocalUpdate,
	setEstimatedTimeAndPrice,
};
