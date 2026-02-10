const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const {
	createDocument,
	getAllDocuments,
	getDocument,
	updateDocument,
	deleteDocument,
} = require("./handlerFactory");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/generateToken");

const documentName = {
	Student: "Student",
	Instructor: "Instructor",
};

//@desc resize images after multer upload image and filtering
const resizeImages = asyncHandler(async (req, res, next) => {
	const fileName = `instructor-${uuidv4()}-${Date.now()}.jpeg`;
	if (req.file) {
		await sharp(req.file.buffer) // sharp only take a buffer so we use memory storage with it
			.resize(600, 600)
			.toFormat("jpeg")
			.jpeg({ quality: 90 })
			.toFile(`upload/instructors/profileImages/${fileName}`);

		// Save image into db when create, update
		req.body.profileImage = fileName;
	}
	next();
});

// @desc create new User
// @route POST /api/v1/:Users
// @access private //DONE
const createUser = (Model) => createDocument(Model, Model.modelName);

// @desc get all Users
// @route GET /api/v1/:Users
// @access private //DONE
const getAllUser = (Model) => getAllDocuments(Model, Model.modelName);

// @desc get one User
// @route GET /api/v1/:Users/:id
// @access private //DONE
const getUserById = (Model) => getDocument(Model, Model.modelName);

// @desc update one User
// @route PATCH /api/v1/:Users/:id
// @access private //DONE
const updateUser = (Model) => updateDocument(Model, Model.modelName);

// @desc delete one User
// @route DELETE /api/v1/:Users/:id
// @access private //DONE
const deleteUser = (Model) => deleteDocument(Model, Model.modelName);

// @desc update password
// @route PUT api/v1/:users/changePassword/:id
// @access Private/Admin //DONE
const changeUserPassword = (Model) =>
	asyncHandler(async (req, res, next) => {
		const { id } = req.params;
		const password = await Model.findByIdAndUpdate(
			id,
			{
				password: await bcrypt.hash(req.body.newPassword, 12),
				passChangedAt: Date.now(),
			},
			{ new: true },
		);
		if (!password)
			return next(
				new ApiError(`Cannot find user id:${id}  and update password`, 404),
			);
		res.status(200).json({
			message: `Password Updated`,
			data: password,
		});
	});

// @desc get Logged user data
// @route api/v1/:users/getMe
// @access Private/Protect //DONE
const getLoggedUserData = (req, res, next) => {
	req.params.id = req.user._id;
	next();
};

// @desc change logged user password
// @route api/v1/:users/updateMyPassword
// @access Private/Protect //DONE
const updateLoggedUserPassword = (Model) =>
	asyncHandler(async (req, res, next) => {
		// 1- update user password based on protect handler
		const user = await Model.findByIdAndUpdate(
			req.user._id,
			{
				password: await bcrypt.hash(req.body.newPassword, 12),
				passChangedAt: Date.now(),
			},
			{ new: true },
		);
		if (!user)
			return next(
				new ApiError(
					`Cannot find user id:${req.user._id}  and update password`,
					404,
				),
			);

		// 2- Generate and send Token
		const token = generateToken({ id: req.user._id });
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production", //when production it will true
				sameSite: "none",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			})
			.status(200)
			.json({
				message: "Password change successfully✅",
				data: user,
			});
	});

// @desc change logged user data (without password and role)
// @route api/v1/:users/updateMe
// @access Private/Protect //DONE
const updateLoggedUserData = (Model) =>
	asyncHandler(async (req, res, next) => {
		const user = await Model.findByIdAndUpdate(
			req.user._id,
			{
				email: req.body.email,
				fullName: req.body.fullName,
				phone: req.body.phone,
			},
			{ new: true },
		);
		res.status(200).json({
			message: "User Updated successfully✅",
			data: user,
		});
	});

// @desc delete logged user
// @route api/v1/:users/deleteMe
// @access Private/Protect //DONE
const deleteLoggedUser = (Model) =>
	asyncHandler(async (req, res, next) => {
		await Model.findByIdAndUpdate(
			req.user._id,
			{
				active: false,
			},
			{ new: true },
		);
		res.status(204).json({
			message: "User deleted successfully❎",
		});
	});

module.exports = {
	createUser,
	getAllUser,
	getUserById,
	updateUser,
	deleteUser,
	resizeImages,
	changeUserPassword,
	deleteLoggedUser,
	updateLoggedUserData,
	updateLoggedUserPassword,
	getLoggedUserData,
};
