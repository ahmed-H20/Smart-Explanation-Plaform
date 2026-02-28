const { check, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Offer = require("../../models/offerModel");
const Order = require("../../models/orderModel");

const createOrderValidator = [
	check("offer")
		// Ensure offer field exists
		.notEmpty()
		.withMessage("يجب إرسال معرف العرض")

		// Validate MongoDB ObjectId format
		.isMongoId()
		.withMessage("معرف العرض غير صالح")

		// Custom validation logic
		.custom(async (offerId, { req }) => {
			// Fetch offer with related request
			const offer = await Offer.findById(offerId).populate("request");

			// Check if offer exists
			if (!offer) {
				throw new Error("العرض غير موجود");
			}

			// Ensure offer is accepted before creating order
			if (offer.status !== "accepted") {
				throw new Error("لا يمكن إنشاء طلب إلا بعد قبول العرض");
			}

			// Ensure logged-in user is the student who owns the request
			if (offer.request.student.toString() !== req.user._id.toString()) {
				throw new Error("غير مسموح لك بإنشاء طلب لهذا العرض");
			}

			// Prevent duplicate orders for same offer
			const existingOrder = await Order.findOne({ offer: offerId });
			if (existingOrder) {
				throw new Error("تم إنشاء طلب مسبقاً لهذا العرض");
			}

			return true;
		}),

	validatorMiddleware,
];

const finishAndSubmitOrderValidator = [
	// 1- Validate order id format
	check("id")
		.isMongoId()
		.withMessage("صيغة رقم الطلب غير صحيحة")

		// 2- Check order existence and business rules
		.custom(async (value, { req }) => {
			// Fetch order from database
			const order = await Order.findById(value);

			// Check if order exists
			if (!order) {
				throw new Error("لا يوجد طلب بهذا الرقم");
			}

			// Check if order is in correct status
			if (!["in_progress", "submitted"].includes(order.status)) {
				throw new Error("لا يمكن إنهاء الطلب في حالته الحالية");
			}

			// Check if current user is instructor
			if (req.user.role !== "instructor") {
				throw new Error("فقط المدرس يمكنه إنهاء الطلب");
			}

			// Check if this instructor owns the order
			if (order.instructor.toString() !== req.user._id.toString()) {
				throw new Error("ليس لديك صلاحية على هذا الطلب");
			}

			// Attach order to request to avoid querying again in controller
			req.order = order;

			return true;
		}),

	validatorMiddleware,
];

const getOrderValidator = [
	// 1- Validate order id format
	check("id")
		.isMongoId()
		.withMessage("صيغة رقم الطلب غير صحيحة")

		// 2- Check order existence and business rules
		.custom(async (value, { req }) => {
			// Fetch order from database
			const order = await Order.findById(value);

			// Check if order exists
			if (!order) {
				throw new Error("لا يوجد طلب بهذا الرقم");
			}

			// Check if this user owns the order
			if (req.user.role === "student") {
				if (order.student.toString() !== req.user._id.toString()) {
					throw new Error("ليس لديك صلاحية على هذا الطلب");
				}
			} else if (req.user.role === "instructor" || req.user.role === "admin") {
				if (order.instructor.toString() !== req.user._id.toString()) {
					throw new Error("ليس لديك صلاحية على هذا الطلب");
				}
			}

			return true;
		}),

	validatorMiddleware,
];

const uploadDocsValidator = [
	// 1- Validate order id format
	check("id")
		.isMongoId()
		.withMessage("صيغة رقم الطلب غير صحيحة")

		// 2- Check order existence and business rules
		.custom(async (value, { req }) => {
			// Fetch order from database
			const order = await Order.findById(value);

			// Check if order exists
			if (!order) {
				throw new Error("لا يوجد طلب بهذا الرقم");
			}

			// Check if order is in correct status
			if (order.status !== "in_progress") {
				throw new Error("لا يمكن إنهاء الطلب في حالته الحالية");
			}

			// Check if current user is instructor
			if (req.user.role !== "instructor") {
				throw new Error("فقط المدرس يمكنه رفع الملفات");
			}

			// Check if this instructor owns the order
			if (order.instructor.toString() !== req.user._id.toString()) {
				throw new Error("ليس لديك صلاحية على هذا الطلب");
			}

			// Attach order to request to avoid querying again in controller
			req.order = order;

			return true;
		}),

	validatorMiddleware,
];

const getUploadVideoUrlValidator = [
	param("orderId")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val, { req }) => {
			const order = await Order.findById(val);
			if (!order) throw new Error("هذا العرض غير موجود");

			if (order.instructor.toString() !== req.user._id.toString())
				throw new Error("ليس لديك الصلاحية لرفع فيديو لهذا العرض");

			if (order.isDeleted) throw new Error("لا يمكن رفع فيديو لعرض محذوف");

			return true;
		}),

	validatorMiddleware,
];

module.exports = {
	createOrderValidator,
	finishAndSubmitOrderValidator,
	getOrderValidator,
	uploadDocsValidator,
	getUploadVideoUrlValidator,
};
