const express = require("express");
const {
	signup,
	login,
	forgetPassword,
	verifyResetCode,
	resetPassword,
	fileLocalUpdate,
	uploadFiles,
} = require("../controllers/authController");

// models
const Instructors = require("../models/instructorsModel");
const Students = require("../models/studentsModel");

// instructor validation
const {
	loginValidator,
	signupInstructorValidator,
	forgetPasswordValidator,
	signupStudentValidator,
	verifyResetCodeValidator,
	resetPasswordValidator,
} = require("../utils/validators/authValidator");

const router = express.Router();

// Instructor Routes
router.post(
	"/instructors/signup",
	signupInstructorValidator,
	signup(Instructors),
);
router.post("/instructors/login", loginValidator, login(Instructors));
router.post(
	"/instructors/forgetPassword",
	forgetPasswordValidator,
	forgetPassword(Instructors),
);
router.post(
	"/instructors/verifyResetCode",
	verifyResetCodeValidator,
	verifyResetCode(Instructors),
);
router.put(
	"/instructors/resetPassword",
	resetPasswordValidator,
	resetPassword(Instructors),
);

// Student Routes
router.post(
	"/students/signup",
	uploadFiles,
	fileLocalUpdate,
	signupStudentValidator,
	signup(Students),
);
router.post("/students/login", loginValidator, login(Students));
router.post(
	"/students/forgetPassword",
	forgetPasswordValidator,
	forgetPassword(Students),
);
router.post(
	"/students/verifyResetCode",
	verifyResetCodeValidator,
	verifyResetCode(Students),
);
router.put(
	"/students/resetPassword",
	resetPasswordValidator,
	resetPassword(Students),
);

module.exports = router;
