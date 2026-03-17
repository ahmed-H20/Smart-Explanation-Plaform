const express = require("express");
const {
	createRequest,
	acceptAssignmentRequest,
	uploadSolvedPdf,
	uploadFiles,
	fileLocalUpdate,
	getLoggedUserSolution,
	approveAssignmentSolution,
	requestAssignmentMeeting,
	scheduleAssignmentMeeting,
} = require("../controllers/assignmentController");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createAssignmentRequestValidator,
	acceptRequestValidator,
	uploadDocsValidator,
	getSolutionById,
	approveAssignmentValidator,
	requestMeetingValidator,
	scheduleMeetingValidator,
} = require("../utils/validators/assignmentsValidator");

const router = express.Router();

router.put(
	"/:id/accept",
	protect(),
	allowedTo("instructor"),
	acceptRequestValidator,
	acceptAssignmentRequest,
);

router.put(
	"/:id/uploadPdf",
	protect(),
	allowedTo("instructor"),
	uploadFiles,
	fileLocalUpdate,
	uploadDocsValidator,
	uploadSolvedPdf,
);

router.get(
	"/:id/getSolution",
	protect(),
	allowedTo("student", "instructor"),
	getSolutionById,
	getLoggedUserSolution,
);

router.put(
	"/:id/requestMeeting",
	protect(),
	allowedTo("student"),
	requestMeetingValidator,
	requestAssignmentMeeting,
);

router.put(
	"/:id/scheduleMeeting",
	protect(),
	allowedTo("instructor"),
	scheduleMeetingValidator,
	scheduleAssignmentMeeting,
);

router.put(
	"/:id/requestApproval",
	protect(),
	allowedTo("student"),
	approveAssignmentValidator,
	approveAssignmentSolution,
);

router.post(
	"/createRequests",
	protect(),
	allowedTo("student"),
	createAssignmentRequestValidator,
	createRequest,
);

module.exports = router;
