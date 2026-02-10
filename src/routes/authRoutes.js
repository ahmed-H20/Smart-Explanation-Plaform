const express = require("express");
const {
	signup,
	login,
	forgetPassword,
	verifyResetCode,
	resetPassword,
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
	// TODO: check email auth2 from google and update env
	"/instructors/forgetPassword",
	forgetPasswordValidator,
	forgetPassword(Instructors),
);

// Student Routes
router.post("/students/signup", signupStudentValidator, signup(Students));
router.post("/students/login", loginValidator, login(Students));
router.post(
	// TODO: check email auth2 from google and update env
	"/students/forgetPassword",
	forgetPasswordValidator,
	forgetPassword(Students),
);

module.exports = router;
