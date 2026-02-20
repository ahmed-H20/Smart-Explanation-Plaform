const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Offer = require("../../models/offerModel");
const Request = require("../../models/requestModel");

// ── Create Offer ──────────────────────────────────────────────────────────────
const createOfferValidator = [
	body("request")
		.notEmpty()
		.withMessage("معرّف الطلب مطلوب")
		.isMongoId()
		.withMessage("معرّف الطلب غير صحيح")
		.custom(async (val) => {
			const request = await Request.findById(val);
			if (!request) throw new Error("هذا الطلب غير موجود");
			if (request.status !== "open")
				throw new Error("لا يمكن إرسال عرض على طلب غير مفتوح");
			return true;
		}),

	body("estimateTime")
		.not()
		.exists()
		.withMessage("لا يمكنك تحديد الوقت التقديري عند إنشاء العرض"),

	body("studentPrice")
		.not()
		.exists()
		.withMessage("لا يمكنك تحديد السعر عند الإنشاء"),

	body("instructorPrice")
		.not()
		.exists()
		.withMessage("لا يمكنك تحديد السعر عند الإنشاء"),

	body("status")
		.not()
		.exists()
		.withMessage("لا يمكنك تحديد الحالة عند الإنشاء"),

	// demo video
	body("demoVideo.uploadUrl")
		.optional()
		.isString()
		.withMessage("invalid uploadId"),

	validatorMiddleware,
];

// ── Update Offer ──────────────────────────────────────────────────────────────
const updateOfferValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val, { req }) => {
			const offer = await Offer.findById(val);
			if (!offer) throw new Error("هذا العرض غير موجود");

			if (offer.instructor.toString() !== req.user._id.toString())
				throw new Error("ليس لديك الصلاحية لتعديل هذا العرض");

			if (!["is-processing", "pending"].includes(offer.status))
				throw new Error("لا يمكن تعديل عرض في هذه الحالة");

			req.offerDoc = offer;
			return true;
		}),

	// body("estimateTime")
	// .optional()
	// .isNumeric()
	// .withMessage("الوقت التقديري يجب أن يكون رقماً")
	// .isFloat({ min: 1 })
	// .withMessage("الوقت التقديري يجب أن يكون يوماً واحداً على الأقل"),

	body("price")
		.optional()
		.isNumeric()
		.withMessage("السعر يجب أن يكون رقماً")
		.isFloat({ min: 0 })
		.withMessage("السعر يجب أن يكون رقماً موجباً"),

	body("studentCurrency")
		.optional()
		.isString()
		.withMessage("عملة الطالب يجب أن تكون نصاً")
		.isLength({ min: 3, max: 3 })
		.withMessage("رمز العملة يجب أن يكون 3 أحرف"),

	body("instructorCurrency")
		.optional()
		.isString()
		.withMessage("عملة المدرّس يجب أن تكون نصاً")
		.isLength({ min: 3, max: 3 })
		.withMessage("رمز العملة يجب أن يكون 3 أحرف"),

	body("status").not().exists().withMessage("لا يمكنك تعديل حالة العرض من هنا"),

	body("request")
		.not()
		.exists()
		.withMessage("لا يمكنك تغيير الطلب المرتبط بالعرض"),

	body("instructor")
		.not()
		.exists()
		.withMessage("لا يمكنك تغيير المدرّس المرتبط بالعرض"),

	validatorMiddleware,
];

// ── Get Single Offer ──────────────────────────────────────────────────────────
const offerIdValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح"),

	validatorMiddleware,
];

// ── Get Offers For Request ────────────────────────────────────────────────────
const getOffersForRequestValidator = [
	param("requestId")
		.notEmpty()
		.withMessage("معرّف الطلب مطلوب")
		.isMongoId()
		.withMessage("معرّف الطلب غير صحيح")
		.custom(async (val) => {
			const request = await Request.findById(val);
			if (!request) throw new Error("هذا الطلب غير موجود");
			return true;
		}),

	validatorMiddleware,
];

// ── Cancel Offer ──────────────────────────────────────────────────────────────
const cancelOfferValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val, { req }) => {
			const offer = await Offer.findById(val);
			if (!offer) throw new Error("هذا العرض غير موجود");

			if (offer.instructor.toString() !== req.user._id.toString())
				throw new Error("ليس لديك الصلاحية لإلغاء هذا العرض");

			if (!["is-processing", "pending"].includes(offer.status))
				throw new Error("لا يمكن إلغاء عرض في هذه الحالة");

			req.offerDoc = offer;
			return true;
		}),

	validatorMiddleware,
];

// ── Accept Offer ──────────────────────────────────────────────────────────────
const acceptOfferValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val, { req }) => {
			const offer = await Offer.findById(val);
			if (!offer) throw new Error("هذا العرض غير موجود");

			if (offer.status !== "pending")
				throw new Error("لا يمكن قبول عرض غير معلّق");

			return true;
		}),

	body("request")
		.notEmpty()
		.withMessage("معرّف الطلب مطلوب")
		.isMongoId()
		.withMessage("معرّف الطلب غير صحيح")
		.custom(async (val, { req }) => {
			const request = await Request.findById(val);
			if (!request) throw new Error("هذا الطلب غير موجود");

			if (request.student.toString() !== req.user._id.toString())
				throw new Error("ليس لديك الصلاحية لقبول عرض على هذا الطلب");

			if (request.status !== "open")
				throw new Error("لا يمكن قبول عرض على طلب غير مفتوح");

			return true;
		}),

	validatorMiddleware,
];

// ── Delete Offer ──────────────────────────────────────────────────────────────
const deleteOfferValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val) => {
			const offer = await Offer.findById(val);
			if (!offer) throw new Error("هذا العرض غير موجود");
			return true;
		}),

	validatorMiddleware,
];

// ── Get Upload URL ────────────────────────────────────────────────────────────
const getUploadVideoUrlValidator = [
	param("offerId")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val, { req }) => {
			const offer = await Offer.findById(val);
			if (!offer) throw new Error("هذا العرض غير موجود");

			if (offer.instructor.toString() !== req.user._id.toString())
				throw new Error("ليس لديك الصلاحية لرفع فيديو لهذا العرض");

			if (offer.isDeleted) throw new Error("لا يمكن رفع فيديو لعرض محذوف");

			return true;
		}),

	validatorMiddleware,
];

module.exports = {
	createOfferValidator,
	updateOfferValidator,
	offerIdValidator,
	getOffersForRequestValidator,
	cancelOfferValidator,
	acceptOfferValidator,
	deleteOfferValidator,
	getUploadVideoUrlValidator,
};
