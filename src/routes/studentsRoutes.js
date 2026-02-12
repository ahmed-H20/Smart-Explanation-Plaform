const express = require("express");
const {
	createUser,
	getAllUser,
	getUserById,
	updateUser,
	deleteUser,
	resizeImages,
	changeUserPassword,
	getLoggedUserData,
	updateLoggedUserPassword,
	deleteLoggedUser,
	updateLoggedUserData,
} = require("../controllers/userController");
const {
	createStudentValidator,
	updateStudentValidator,

	getIdValidator,
	changeUserPasswordValidator,
	changeLoggedUserPasswordValidator,
	updateLoggedUsersValidator,
} = require("../utils/validators/userValidator");

const { uploadSingleImage } = require("../middlewares/uploadImagesMiddleware");
const { allowedTo, protect } = require("../controllers/authController");
const studentModel = require("../models/studentsModel");
const instructorModel = require("../models/instructorsModel");

const router = express.Router();

router.get(
	"/getMe",
	protect(studentModel),
	getLoggedUserData,
	getUserById(studentModel),
);
router.put(
	"/updateMyPassword",
	protect(studentModel),
	changeLoggedUserPasswordValidator,
	updateLoggedUserPassword(studentModel),
);
router.put(
	"/updateMe",
	protect(studentModel),
	updateLoggedUsersValidator,
	updateLoggedUserData(studentModel),
);
router.delete(
	"/deleteMe",
	protect(studentModel),
	deleteLoggedUser(studentModel),
);

// Instructor CRUD
router.use(protect(instructorModel), allowedTo("admin"));
router
	.route("/")
	.post(
		uploadSingleImage("profileImage"),
		resizeImages,
		createStudentValidator,
		createUser(studentModel),
	)
	.get(getAllUser(studentModel));
router
	.route("/:id")
	.get(getUserById(studentModel))
	.patch(
		uploadSingleImage("profileImage"),
		updateStudentValidator,
		updateUser(studentModel),
	)
	.delete(getIdValidator, deleteUser(studentModel));

router.put(
	"/changePassword/:id",
	allowedTo("instructor", "admin"),
	changeUserPasswordValidator,
	changeUserPassword(studentModel),
);

module.exports = router;
