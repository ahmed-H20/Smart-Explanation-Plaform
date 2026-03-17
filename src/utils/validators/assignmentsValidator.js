const { body, param, check } = require("express-validator");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const majorModel = require("../../models/majorModel");
const Request = require("../../models/requestModel");
const ApiError = require("../ApiError");
const Order = require("../../models/orderModel");

const createAssignmentRequestValidator = [
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
		.notEmpty()
		.withMessage("سعر الطلب الطلب مطلوب")
		.isNumeric()
		.withMessage("الميزانية يجب أن تكون رقم")
		.isFloat({ min: 10 })
		.withMessage("الميزانية يجب أن لا تقل عن 10"),

	// body("demoFiles").custom((value, { req }) => {
	// 	if (
	// 		!req.files ||
	// 		!req.files.demoFiles ||
	// 		req.files.demoFiles.length === 0
	// 	) {
	// 		throw new Error("يجب رفع ملف واحد على الأقل");
	// 	}
	// 	return true;
	// }),

	// body("demoFiles.*").notEmpty().withMessage("ملف العرض لا يمكن أن يكون فارغ"),

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
	body("student").isEmpty().withMessage("الطالب يتم تحديده بمجرد سجيل الدخول"),

	validatorMiddleware,
];

const acceptRequestValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف العرض مطلوب")
		.isMongoId()
		.withMessage("معرّف العرض غير صحيح")
		.custom(async (val, { req }) => {
			// Single DB call with populate
			const request = await Request.findOne({
				_id: val,
				status: "open",
			}).populate({
				path: "student",
				populate: [
					{ path: "country", select: "currencyCode" },
					{ path: "wallet" },
				],
			});
			// .lean(); //no mongoose document overhead

			if (!request) throw new ApiError("هذا الطلب غير موجود!", 400);

			// Check request wallet
			if (!request.student.wallet.balance) {
				throw new Error("خطأ فى محفظة الطالب ");
			}
			if (request.student.wallet.balance < request.budget)
				throw new ApiError("رصيد غير كافٍ", 400);

			// update request status
			request.status = "in-progress";
			await request.save();

			// Attach request to request object to reuse in controller
			req.request = request;

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

const getSolutionById = [
	// 1- Validate order id format
	param("id")
		.isMongoId()
		.withMessage("صيغة رقم الطلب غير صحيحة")

		// 2- Check order existence and business rules
		.custom(async (value, { req }) => {
			let order;
			if (req.user.role === "student") {
				order = await Order.findOne({ student: req.user._id, _id: value });
			} else if (req.user.role === "instructor") {
				order = await Order.findOne({ instructor: req.user._id, _id: value });
			} else {
				throw new ApiError("غير مصرح لك", 403);
			}

			// Check if order exists
			if (!order) {
				throw new Error("لا يوجد طلب بهذا الرقم");
			}

			// Check if order is in correct status
			if (order.status !== "completed") {
				throw new Error("لا يمكن إنهاء الطلب في حالته الحالية");
			}

			// Attach order to request to avoid querying again in controller
			req.order = order;

			return true;
		}),

	validatorMiddleware,
];

const approveAssignmentValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف الأوردر مطلوب")
		.isMongoId()
		.withMessage("معرّف الأوردر غير صحيح")
		.custom(async (val, { req }) => {
			// Get order by id
			const order = await Order.findById(val).populate([
				{ path: "student", populate: { path: "wallet" } },
				{ path: "instructor", populate: { path: "wallet" } },
			]);

			if (!order) throw new ApiError("الأوردر غير موجود", 404);

			// Only student can approve
			if (req.user.role !== "student") {
				throw new ApiError("غير مصرح لك", 403);
			}

			// Check student ownership
			if (order.student._id.toString() !== req.user._id.toString()) {
				throw new ApiError("غير مصرح لك الموافقة على هذا الأوردر", 403);
			}

			// Check order status
			if (order.status !== "completed") {
				throw new ApiError("لا يمكن اعتماد أوردر غير مكتمل", 400);
			}

			// Check student wallet
			if (!order.student.wallet) {
				throw new ApiError("محفظة الطالب غير موجودة", 404);
			}
			if (order.student.wallet.balance < order.studentPrice) {
				throw new ApiError("رصيد الطالب غير كافٍ", 400);
			}

			// Attach order to req to reuse in controller
			req.order = order;

			return true;
		}),

	validatorMiddleware,
];

const requestMeetingValidator = [
	param("id")
		.notEmpty()
		.withMessage("معرّف الأوردر مطلوب")
		.isMongoId()
		.withMessage("معرّف الأوردر غير صحيح")
		.custom(async (val, { req }) => {
			// Get order
			const order = await Order.findById(val).populate("student");

			if (!order) {
				throw new ApiError("الأوردر غير موجود", 404);
			}

			// Only student can request meeting
			if (req.user.role !== "student") {
				throw new ApiError("غير مصرح لك", 403);
			}

			// Ensure ownership
			if (order.student._id.toString() !== req.user._id.toString()) {
				throw new ApiError("غير مصرح لك بطلب اجتماع لهذا الأوردر", 403);
			}

			// Ensure solution already submitted
			if (order.status !== "submitted") {
				throw new ApiError("لا يمكن طلب اجتماع إلا بعد تسليم الحل", 400);
			}

			// Prevent duplicate request
			if (
				order.status === "meeting_requested" ||
				order.status === "meeting_scheduled"
			) {
				throw new ApiError("تم طلب الاجتماع بالفعل", 400);
			}

			// Prevent if already approved or completed
			if (order.status === "approved" || order.status === "completed") {
				throw new ApiError("لا يمكن طلب اجتماع لأوردر مكتمل", 400);
			}
			console.log("validation order:", order);

			// Attach order
			req.order = order;

			console.log("meeting", order);

			return true;
		}),

	validatorMiddleware,
];

const scheduleMeetingValidator = [
	// 1️⃣ Validate order ID
	param("id")
		.notEmpty()
		.withMessage("معرّف الأوردر مطلوب")
		.isMongoId()
		.withMessage("معرّف الأوردر غير صحيح")
		.custom(async (val, { req }) => {
			const order = await Order.findById(val).populate("student");

			if (!order) throw new ApiError("الأوردر غير موجود", 404);
			if (!order.student)
				throw new ApiError("الطالب غير موجود في الأوردر", 404);

			req.order = order; // attach order to request
			return true;
		}),

	// 2️⃣ Validate meeting time
	body("time")
		.notEmpty()
		.withMessage("يجب تحديد وقت الاجتماع")
		.isISO8601()
		.withMessage("صيغة التاريخ غير صحيحة")
		.custom((value) => {
			const date = new Date(value);
			if (date <= new Date()) {
				throw new Error("وقت الاجتماع يجب أن يكون تاريخ مستقبلي");
			}
			return true;
		}),

	validatorMiddleware,
];

module.exports = {
	createAssignmentRequestValidator,
	acceptRequestValidator,
	uploadDocsValidator,
	approveAssignmentValidator,
	getSolutionById,
	requestMeetingValidator,
	scheduleMeetingValidator,
};
