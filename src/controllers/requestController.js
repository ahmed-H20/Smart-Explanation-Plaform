const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const {
	createDocument,
	getAllDocuments,
	getDocument,
} = require("./handlerFactory");
const Model = require("../models/requestModel");
const ApiError = require("../utils/ApiError");
const { uploadMixOfFiles } = require("../middlewares/uploadFilesMiddleware");

const uploadFiles = uploadMixOfFiles([
	{
		name: "demoFiles",
		maxCount: 5,
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
// @access private student //DONE
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
};
