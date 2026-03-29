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

module.exports = router;
