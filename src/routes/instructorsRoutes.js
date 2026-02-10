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
	createInstructorValidator,
	updateInstructorValidator,
	getIdValidator,
	changeLoggedUserPasswordValidator,
	updateLoggedUsersValidator,
	changeUserPasswordValidator,
} = require("../utils/validators/userValidator");
const { uploadSingleImage } = require("../middlewares/uploadImagesMiddleware");
const { allowedTo, protect } = require("../controllers/authController");
const instructorModel = require("../models/instructorsModel");

const router = express.Router();

router.use(protect(instructorModel));

// logged Instructor //DONE
router.get("/getMe", getLoggedUserData, getUserById(instructorModel));
router.put(
	"/updateMyPassword",
	changeLoggedUserPasswordValidator,
	updateLoggedUserPassword(instructorModel),
);
router.put(
	"/updateMe",
	updateLoggedUsersValidator,
	updateLoggedUserData(instructorModel),
);
router.delete("/deleteMe", deleteLoggedUser(instructorModel));

// Instructor CRUD
router.use(allowedTo("admin"));
router
	.route("/")
	.post(
		uploadSingleImage("profileImage"),
		resizeImages,
		createInstructorValidator,
		createUser(instructorModel),
	)
	.get(getAllUser(instructorModel));
router
	.route("/:id")
	.get(getIdValidator, getUserById(instructorModel))
	.patch(
		uploadSingleImage("profileImage"),
		updateInstructorValidator,
		updateUser(instructorModel),
	)
	.delete(getIdValidator, deleteUser(instructorModel));

router.put(
	"/changePassword/:id",
	protect(instructorModel),
	allowedTo("instructor", "admin"),
	changeUserPasswordValidator,
	changeUserPassword(instructorModel),
);

module.exports = router;
