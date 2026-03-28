const { body, param } = require("express-validator");
const mongoose = require("mongoose");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Request = require("../../models/requestModel");
const studentModel = require("../../models/studentsModel");
const majorModel = require("../../models/majorModel");

// helper
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createRequestValidator = [
	body("major")
		.notEmpty()
		.withMessage("يجب تحديد التخصص")
		.isMongoId()
		.withMessage("id التخصص غير صحيح")
		.custom(async (val) => {
			const major = await majorModel.findById(val);
			if (!major) {
				throw new Error("هذا التخصص غير موجود");
			}
			return true;
		}),

	body("title")
		.optional()
		.isString()
		.withMessage("العنوان يجب أن يكون نص")
		.isLength({ max: 200 })
		.withMessage("العنوان يجب ألا يزيد عن 200 حرف"),

	body("description")
		.notEmpty()
		.withMessage("وصف الطلب مطلوب")
		.isLength({ min: 10 })
		.withMessage("وصف الطلب يجب ألا يقل عن 10 أحرف"),

	body("budget")
		.optional()
		.isNumeric()
		.withMessage("الميزانية يجب أن تكون رقم")
		.isFloat({ min: 0 })
		.withMessage("الميزانية يجب أن تكون رقم موجب"),

	body("demoFiles").custom((value, { req }) => {
		if (
			!req.files ||
			!req.files.demoFiles ||
			req.files.demoFiles.length === 0
		) {
			throw new Error("يجب رفع ملف واحد على الأقل");
		}
		return true;
	}),

	body("demoFiles.*").notEmpty().withMessage("ملف العرض لا يمكن أن يكون فارغ"),

	body("deadline")
		.notEmpty()
		.withMessage("يجب تحديد الموعد النهائي")
		.isISO8601()
		.withMessage("صيغة التاريخ غير صحيحة")
		.custom((value) => {
			if (new Date(value) <= new Date()) {
				throw new Error("الموعد النهائي يجب أن يكون تاريخ مستقبلي");
			}
			return true;
		}),

	body("status").isEmpty(),

	validatorMiddleware,
];

const createDiractRequestValidator = [
	body("major")
		.notEmpty()
		.withMessage("يجب تحديد التخصص")
		.isMongoId()
		.withMessage("id التخصص غير صحيح")
		.custom(async (val) => {
			const major = await majorModel.findById(val);
			if (!major) {
				throw new Error("هذا التخصص غير موجود");
			}
			return true;
		}),

	body("title")
		.optional()
		.isString()
		.withMessage("العنوان يجب أن يكون نص")
		.isLength({ max: 200 })
		.withMessage("العنوان يجب ألا يزيد عن 200 حرف"),

	body("description")
		.notEmpty()
		.withMessage("وصف الطلب مطلوب")
		.isLength({ min: 10 })
		.withMessage("وصف الطلب يجب ألا يقل عن 10 أحرف"),

	body("budget")
		.optional()
		.isNumeric()
		.withMessage("الميزانية يجب أن تكون رقم")
		.isFloat({ min: 0 })
		.withMessage("الميزانية يجب أن تكون رقم موجب"),

	body("files").custom((value, { req }) => {
		if (!req.files || !req.files.allFiles || req.files.allFiles.length === 0) {
			throw new Error("يجب رفع ملف واحد على الأقل");
		}
		return true;
	}),

	body("files.*").notEmpty().withMessage("ملف العرض لا يمكن أن يكون فارغ"),

	body("deadline")
		.notEmpty()
		.withMessage("يجب تحديد الموعد النهائي")
		.isISO8601()
		.withMessage("صيغة التاريخ غير صحيحة")
		.custom((value) => {
			if (new Date(value) <= new Date()) {
				throw new Error("الموعد النهائي يجب أن يكون تاريخ مستقبلي");
			}
			return true;
		}),

	body("status").isEmpty(),

	validatorMiddleware,
];

const updateRequestValidator = [
	param("id")
		.notEmpty()
		.withMessage("request id is required")
		.isMongoId()
		.withMessage("invalid request id")
		.custom(async (val, { req }) => {
			const request = await Request.findById(val);
			if (!request) {
				throw new Error("هذا الطلب غير موجود ");
			}

			if (request.student.toString() !== req.user._id.toString()) {
				throw new Error("ليس لديك الصلاجية للتعديل على هذا الطلب ");
			}

			if (request.status !== "open") {
				throw new Error("لا يمكن تعديل طلب غير مفتوح");
			}

			req.requestDoc = request;
			return true;
		}),

	body("major")
		.optional()
		.isMongoId()
		.withMessage("id التخصص غير صحيح")
		.custom(async (val) => {
			const major = await majorModel.findById(val);
			if (!major) {
				throw new Error("هذا التخصص غير موجود");
			}
			return true;
		}),

	body("title")
		.optional()
		.isString()
		.withMessage("العنوان يجب أن يكون نص")
		.isLength({ max: 200 })
		.withMessage("العنوان يجب ألا يزيد عن 200 حرف"),

	body("description")
		.optional()
		.isLength({ min: 10 })
		.withMessage("وصف الطلب يجب ألا يقل عن 10 أحرف"),

	body("budget")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("الميزانية يجب أن تكون رقم موجب"),

	body("deadline")
		.optional()
		.isISO8601()
		.withMessage("صيغة التاريخ غير صحيحة")
		.custom((value) => {
			if (new Date(value) <= new Date()) {
				throw new Error("الموعد النهائي يجب أن يكون تاريخ مستقبلي");
			}
			return true;
		}),

	body("status").not().exists().withMessage("لا يمكنك التعديل على حالة الطلب"),

	validatorMiddleware,
];

const requestIdValidator = [
	param("id").isMongoId().withMessage("invalid request id"),
	validatorMiddleware,
];

const changeRequestStatusValidator = [
	param("id")
		.notEmpty()
		.withMessage("request id is required")
		.isMongoId()
		.withMessage("invalid request id")
		.custom(async (val, { req }) => {
			const request = await Request.findById(val);
			if (!request) {
				throw new Error("هذا الطلب غير موجود ");
			}

			req.requestDoc = request;
			return true;
		}),

	body("status")
		.notEmpty()
		.withMessage("حالة الطلب الجديدة مطلوبة")
		.bail()
		.isIn(["open", "in-progress", "completed", "cancelled"])
		.withMessage(
			'حالة الطالب يجب ان تكون واحدة من: "open", "in-progress", "completed", "cancelled"',
		),

	validatorMiddleware,
];

const cancelRequestValidator = [
	param("id")
		.notEmpty()
		.withMessage("request id is required")
		.isMongoId()
		.withMessage("invalid request id")
		.custom(async (val, { req }) => {
			const request = await Request.findById(val);
			if (!request) {
				throw new Error("هذا الطلب غير موجود ");
			}

			if (request.student.toString() !== req.user._id.toString()) {
				throw new Error("ليس لديك الصلاجية للتعديل على هذا الطلب ");
			}

			if (request.status !== "open") {
				throw new Error("لا يمكن تعديل طلب غير مفتوح");
			}

			req.requestDoc = request;
			return true;
		}),

	validatorMiddleware,
];

const acceptDirectRequestValidator = [
	// ── Param ──────────────────────────────────────────────────────
	param("id")
		.notEmpty()
		.withMessage("Request ID is required")
		.custom(isValidObjectId)
		.withMessage("Invalid request ID format")
		.custom(async (id, { req }) => {
			const request = await Request.findById(id).populate({
				path: "student",
				select: "wallet country",
				populate: [
					{ path: "wallet", select: "balance _id" },
					{ path: "country", select: "currencyCode" },
				],
			});

			if (!request) {
				throw new Error("Request not found");
			}

			if (request.isDeleted) {
				throw new Error("This request has been deleted");
			}

			if (request.creationType !== "directAccept") {
				throw new Error("This request is not a direct request");
			}

			if (request.status !== "open") {
				throw new Error(
					`Cannot accept a request with status: ${request.status}`,
				);
			}

			// attach to req so the controller doesn't re-fetch
			req.requestDoc = request;
		}),

	validatorMiddleware,
];

module.exports = {
	createRequestValidator,
	updateRequestValidator,
	requestIdValidator,
	changeRequestStatusValidator,
	cancelRequestValidator,
	createDiractRequestValidator,
	acceptDirectRequestValidator,
};
