const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { generateToken } = require("../utils/generateToken");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");

// @desc signup user
// @route /api/v1/auth/:model/signup
// @access public
const signup = (Model) =>
	asyncHandler(async (req, res, next) => {
		//1- create new user
		const user = await Model.create(req.body);

		//2- generate token
		const token = generateToken({ id: user._id });

		// return res
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production", //when production it will true
				sameSite: "none",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			})
			.status(201)
			.json({
				message: `Signup ${Model.modelName} successful`,
				data: user,
			});
	});

// @desc login user
// @route /api/v1/auth/:model/login
// @access public
const login = (Model) =>
	asyncHandler(async (req, res, next) => {
		// 1- get email , password
		const { email, password } = req.body;

		// 2- check user from email
		const user = await Model.findOne({ email }).select("+password");
		console.log("pass", user);

		// 3- check password correct
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return next(new ApiError("Incorrect email or password", 401));
		}

		user.active = true;
		await user.save();

		// 4- Generate token
		const token = generateToken({ id: user._id });

		// 5- send res
		res
			.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production", //when production it will true
				sameSite: "none",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			})
			.status(201)
			.json({
				message: `login ${Model.modelName} successful`,
				data: user,
			});
	});

// @desc Authentication (protect apis)
const protect = (Model) =>
	asyncHandler(async (req, res, next) => {
		// 1- check if req have token , if exist get in variable
		let token;
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		}
		// If not in header, check cookies
		if (!token && req.cookies?.token) {
			// eslint-disable-next-line prefer-destructuring
			token = req.cookies.token;
		}

		if (!token) {
			return next(new ApiError("You are not authenticated, Please login", 401));
		}

		// 2- check token valid
		const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);

		// 3- check if user exist
		const currentUser = await Model.findById(decode.id);

		if (!currentUser) {
			return next(
				new ApiError("The user belong to this token has no longer exist", 401),
			);
		}
		if (!currentUser.active) {
			return next(new ApiError("The user not active ❌", 401));
		}

		// 4- check if user not change password after token created
		if (currentUser.passChangedAt) {
			const passChangedTimestamp = parseInt(
				// convert to timestamp in sec
				currentUser.passChangedAt.getTime() / 1000,
				10,
			);
			if (passChangedTimestamp > decode.iat) {
				return next(
					new ApiError("User change his password , please login again ... "),
				);
			}
		}

		req.user = currentUser;

		next();
	});

// @desc Authentication (Permeation)
const allowedTo = (...roles) =>
	asyncHandler(async (req, res, next) => {
		// 2- check user role in roles
		if (!roles.includes(req.user.role)) {
			return next(
				new ApiError("You don't have permission to access this route!", 403),
			);
		}
		next();
	});

// @desc forget password
// @route POST api/v1/auth/:model/forgetPassword
// @access private
const forgetPassword = (Model) =>
	asyncHandler(async (req, res, next) => {
		// 1- get user by email
		const user = await Model.findOne({ email: req.body.email });
		if (!user)
			return next(
				new ApiError(`There is no user with this email: ${req.body.email}`),
			);

		// 2- if exist generate 6 radom numbers, hash it , save in db
		// generate random 6 digits
		const resetCode = Array.from(
			{ length: 6 },
			() => Math.floor(Math.random() * 9) + 1,
		).toString();
		// hash 6 digits
		const hashResetCode = crypto
			.createHash("sha256")
			.update(resetCode)
			.digest("hex");
		// save in db
		user.passResetCode = hashResetCode;
		user.passResetCodeExpire = Date.now() + 10 * 60 * 1000; //expire in +10 min from now
		user.passResetCodeVerified = false;
		user.save();

		// 3- send this code to email
		await sendEmail({
			from: "Ahmed",
			to: "ahmedheshamahah2003@gmail.com",
			subject: "your password reset code (valid for 10 min)",
			message: `your code is ${resetCode.split(",").join("")}`,
		});

		// 4- send res
		res.status(200).json({
			status: "Success",
			message: "Reset code is sent to email💌",
		});
	});

// @desc Verify Reset Code
// @route POST api/v1/auth/:model/verifyResetCode
// @access Public
const verifyResetCode = (Model) =>
	asyncHandler(async (req, res, next) => {
		// 1- take reset code , hash it , compare with db rest code
		const hashResetCode = crypto
			.createHash("sha256")
			.update(req.body.resetCode.split("").join(","))
			.digest("hex");
		const user = await Model.findOne({
			passResetCode: hashResetCode,
			passResetCodeExpire: { $gt: Date.now() },
		});
		if (!user) {
			return next(new ApiError("Invalid reset code or expired", 404));
		}

		// 2- if valid make verify in db true
		user.passResetCodeVerified = true;
		await user.save();

		res.status(200).json({
			status: "success",
			message: "reset code verified ✅",
		});
	});

// @desc reset password
// @route POST api/v1/auth/:model/resetPassword
// @access private
const resetPassword = (Model) =>
	asyncHandler(async (req, res, next) => {
		// 1- get user from email
		const user = await Model.findOne({ email: req.body.email });
		if (!user)
			return next(
				new ApiError(`There is no user with email: ${req.body.email}`, 404),
			);

		// 2- check if reset verify true
		if (!user.passResetCodeVerified)
			return next(new ApiError(`Reset code not verified!`, 400));

		const token = generateToken({ id: user._id });

		// 3- reset password and make others undefined and false
		user.password = req.body.newPassword;
		user.passChangedAt = Date.now();
		user.passResetCode = undefined;
		user.passResetCodeExpire = undefined;
		user.passResetCodeVerified = undefined;
		await user.save();

		// 4- generate new token and send with req
		res.status(200).json({
			message: "Password reset successfully✅",
			token: token,
		});
	});

module.exports = {
	signup,
	login,
	forgetPassword,
	verifyResetCode,
	resetPassword,
	protect,
	allowedTo,
};
