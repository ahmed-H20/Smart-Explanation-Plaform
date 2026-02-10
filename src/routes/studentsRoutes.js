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

const router = express.Router();

router.use(protect(studentModel));

router.get("/getMe", getLoggedUserData, getUserById(studentModel));
router.put(
	"/updateMyPassword",
	changeLoggedUserPasswordValidator,
	updateLoggedUserPassword(studentModel),
);
router.put(
	"/updateMe",
	updateLoggedUsersValidator,
	updateLoggedUserData(studentModel),
);
router.delete("/deleteMe", deleteLoggedUser(studentModel));

// Instructor CRUD
router.use(allowedTo("admin"));
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
	protect(studentModel),
	allowedTo("instructor", "admin"),
	changeUserPasswordValidator,
	changeUserPassword(studentModel),
);

module.exports = router;
