const asyncHandler = require("express-async-handler");
const crypto = require("crypto");

const Live = require("../models/liveModel");
const LiveDetails = require("../models/liveDetailsModel");
const ApiError = require("../utils/ApiError");

const { updateDocument, deleteDocument } = require("./handlerFactory");

// @desc Create a new live session
// @route POST /api/v1/lives
// @access Private
const createSession = asyncHandler(async (req, res, next) => {
	const { startTime, endTime } = req.body;

	if (!startTime || !endTime) {
		return next(
			new ApiError("startTime, endTime and meetingLink are required", 400),
		);
	}

	// 1- get live
	const live = await Live.findById(req.body.liveId);

	if (!live) {
		return next(new ApiError("Live not found", 404));
	}

	// 2- check sessions count
	if (live.numberOfTotalSessions <= live.numberOfCreatedSessions) {
		return next(new ApiError("No more sessions available", 400));
	}

	// generate unique room name
	const randomString = crypto.randomBytes(6).toString("hex");
	const roomName = `${live.members[0]}-${live._id}-${randomString}`;

	// public jitsi link
	const meetingLink = `https://meet.jit.si/${roomName}`;

	// 3- create live session
	const liveDetails = await LiveDetails.create({
		liveId: live._id,
		startTime,
		endTime,
		meetingLink,
	});

	// 4- decrement available sessions
	live.numberOfCreatedSessions += 1;
	live.timeOfNextSession = startTime;

	await live.save();

	res.status(201).json({
		message: "Live session created successfully",
		data: liveDetails,
	});
});

// @desc Update live session
// @route PATCH /api/v1/lives/:id
// @access Private
const updateLiveSession = updateDocument(LiveDetails, LiveDetails.modelName);

// @desc Delete live session
// @route DELETE /api/v1/lives/:id
// @access Private
const deleteLiveSession = deleteDocument(LiveDetails, LiveDetails.modelName);

// @desc Get one live session
// @route GET /api/v1/lives/:sessionId
// @access Private
const getOne = asyncHandler(async (req, res, next) => {
	const liveSession = await LiveDetails.findById(req.params.sessionId).populate(
		"liveId",
	);

	if (!liveSession) {
		return next(new ApiError("Live session not found", 404));
	}

	res.status(200).json({
		data: liveSession,
	});
});

// @desc Get all sessions for specific live
// @route GET /api/v1/lives/live/:liveId
// @access Private
const getSessionsForLive = asyncHandler(async (req, res, next) => {
	const live = await Live.findById(req.params.liveId);

	if (!live) {
		return next(new ApiError("Live not found", 404));
	}

	const sessions = await LiveDetails.find({
		liveId: req.params.liveId,
	}).sort({ startTime: 1 });

	res.status(200).json({
		results: sessions.length,
		data: sessions,
	});
});

// ================
// LIVE
// ================
// @desc Update Live info
// @route PATCH /api/v1/lives/live/:liveId
// @access Private
const updateLive = updateDocument(Live, Live.modelName);

module.exports = {
	createSession,
	updateLiveSession,
	deleteLiveSession,
	getOne,
	getSessionsForLive,
	updateLive,
};
