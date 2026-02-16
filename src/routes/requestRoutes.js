const express = require("express");
const {
	createRequest,
	getAllRequest,
	getRequestById,
	updateRequest,
	deleteRequest,
	changeRequestStatus,
	cancelRequest,
	getLoggedStudentRequests,
	getStudentId,
	uploadFiles,
	fileLocalUpdate,
} = require("../controllers/requestController");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createRequestValidator,
	requestIdValidator,
	updateRequestValidator,
	changeRequestStatusValidator,
	cancelRequestValidator,
} = require("../utils/validators/requestValidator");

const router = express.Router();

router.use(protect());

router
	.route("/")
	.post(
		allowedTo("student"),
		uploadFiles,
		fileLocalUpdate,
		getStudentId,
		createRequestValidator,
		createRequest,
	)
	.get(allowedTo("admin"), getAllRequest);

router.get("/me", allowedTo("student"), getLoggedStudentRequests);

router
	.route("/:id")
	.get(allowedTo("admin", "student"), requestIdValidator, getRequestById)
	.put(
		allowedTo("student"),
		uploadFiles,
		fileLocalUpdate,
		getStudentId,
		updateRequestValidator,
		updateRequest,
	)
	.delete(allowedTo("admin"), requestIdValidator, deleteRequest);

router
	.route("/:id/status")
	.patch(allowedTo("admin"), changeRequestStatusValidator, changeRequestStatus);
router
	.route("/:id/cancel")
	.patch(allowedTo("student"), cancelRequestValidator, cancelRequest);

module.exports = router;
