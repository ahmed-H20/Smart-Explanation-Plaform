const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const {
	createDocument,
	getAllDocuments,
	getDocument,
} = require("./handlerFactory");
const Model = require("../models/offerModel");
const ApiError = require("../utils/ApiError");

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
	if (!verifyMuxSignature(req)) {
		return next(new ApiError("Invalid signature", 500));
	}
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
			break;

		case "video.asset.failed":
			offer.demoVideo.status = "failed";
			offer.demoVideo.assetId = null;
			break;

		case "video.uploading":
			offer.demoVideo.status = "processing";
			break;

		default:
			break;
	}

	await offer.save();

	return res.status(200).json({ message: "Webhook processed" });
});

// create offer

// reupload if field

module.exports = {
	getUploadVideoUrl,
	handleMuxWebhook,
};
