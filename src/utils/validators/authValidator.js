const { body } = require("express-validator");
const { createInstructorValidator } = require("./userValidator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const signupInstructorValidator = [...createInstructorValidator];

const signupStudentValidator = [
	body("fullName")
		.notEmpty()
		.withMessage("الاسم بالكامل مطلوب")
		.isLength({ min: 5 })
		.withMessage("الاسم يجب أن يكون 5 حروف على الأقل"),

	body("university").notEmpty().withMessage("اسم الجامعة مطلوب"),

	body("faculty").notEmpty().withMessage("اسم الكلية مطلوب"),

	body("specialization")
		.optional()
		.isLength({ min: 2 })
		.withMessage("التخصص يجب أن يكون حرفين على الأقل"),

	body("year")
		.notEmpty()
		.withMessage("السنة الدراسية مطلوبة")
		.isIn(["first", "second", "third", "fourth", "fifth", "sixth", "seventh"])
		.withMessage("السنة الدراسية يجب أن تكون بين first و seventh"),

	body("email")
		.notEmpty()
		.withMessage("البريد الإلكتروني مطلوب")
		.isEmail()
		.withMessage("من فضلك أدخل بريد إلكتروني صحيح"),

	body("password")
		.notEmpty()
		.withMessage("كلمة المرور مطلوبة")
		.isLength({ min: 6 })
		.withMessage("كلمة المرور يجب ألا تقل عن 6 أحرف"),

	body("phoneNumber")
		.notEmpty()
		.withMessage("رقم الهاتف مطلوب")
		.isMobilePhone("ar-EG")
		.withMessage("من فضلك أدخل رقم هاتف مصري صحيح"),

	validatorMiddleware,
];

const loginValidator = [
	// email
	body("email")
		.notEmpty()
		.withMessage("برجاء إدخال البريد الإلكتروني")
		.isEmail()
		.withMessage("برجاء إدخال بريد إلكتروني صحيح"),

	// password
	body("password")
		.notEmpty()
		.withMessage("برجاء إدخال كلمة المرور")
		.isLength({ min: 6 })
		.withMessage("كلمة المرور لا تقل عن 6 حروف"),

	validatorMiddleware,
];

const forgetPasswordValidator = [
	// email
	body("email")
		.notEmpty()
		.withMessage("برجاء إدخال البريد الإلكتروني")
		.isEmail()
		.withMessage("برجاء إدخال بريد إلكتروني صحيح"),
];

module.exports = {
	signupInstructorValidator,
	loginValidator,
	forgetPasswordValidator,
	signupStudentValidator,
};
