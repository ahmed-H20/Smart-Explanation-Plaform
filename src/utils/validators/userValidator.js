const { body, param, check } = require("express-validator");
const bcrypt = require("bcrypt");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const instructorModel = require("../../models/instructorsModel");
const studentModel = require("../../models/studentsModel");
const countryModel = require("../../models/countryModel");

/* 
==================
	Instructor
=================
*/
const createInstructorValidator = [
	// fullName
	body("fullName")
		.notEmpty()
		.withMessage("برجاء إدخال الاسم بالكامل")
		.isString()
		.withMessage("الاسم يجب أن يكون نص")
		.isLength({ min: 5 })
		.withMessage("الاسم لا يقل عن 5 حروف"),

	// age
	body("age")
		.notEmpty()
		.withMessage("برجاء إدخال عمر المدرس")
		.isInt({ min: 16 })
		.withMessage("العمر يجب ألا يقل عن 16 سنة"),

	// status
	body("status")
		.notEmpty()
		.withMessage("برجاء تحديد حالة المدرس")
		.isIn(["student", "graduate", "employed"])
		.withMessage("الحالة يجب أن تكون student أو graduate أو employed"),

	// currentJob (optional)
	body("currentJob")
		.optional()
		.isString()
		.withMessage("الوظيفة الحالية يجب أن تكون نص"),

	// certifications (array of strings)
	body("certifications")
		.optional()
		.isArray()
		.withMessage("الشهادات يجب أن تكون Array"),

	body("certifications.*")
		.optional()
		.isString()
		.withMessage("كل شهادة يجب أن تكون نص"),

	// university
	body("university")
		.notEmpty()
		.withMessage("برجاء إدخال اسم الجامعة")
		.isString()
		.withMessage("اسم الجامعة يجب أن يكون نص"),

	// faculty
	body("faculty")
		.notEmpty()
		.withMessage("برجاء إدخال اسم الكلية")
		.isString()
		.withMessage("اسم الكلية يجب أن يكون نص"),

	// specialization
	body("specialization")
		.notEmpty()
		.withMessage("برجاء إدخال التخصص")
		.isString()
		.withMessage("التخصص يجب أن يكون نص"),

	// email
	body("email")
		.notEmpty()
		.withMessage("برجاء إدخال البريد الإلكتروني")
		.isEmail()
		.withMessage("برجاء إدخال بريد إلكتروني صحيح")
		.custom((email) =>
			instructorModel.findOne({ email: email }).then((result) => {
				if (result) {
					return Promise.reject(new Error("هذا الايميل مستخدم من قبل!"));
				}
				return true;
			}),
		), // not duplicate

	// password
	body("password")
		.notEmpty()
		.withMessage("برجاء إدخال كلمة المرور")
		.isLength({ min: 6 })
		.withMessage("كلمة المرور لا تقل عن 6 حروف"),

	// phoneNumber
	body("phoneNumber")
		.notEmpty()
		.withMessage("برجاء إدخال رقم الهاتف")
		.isMobilePhone(["ar-EG", "ar-SA"])
		.withMessage("برجاء إدخال رقم هاتف مصري او سعودى صحيح")
		.custom((phoneNumber) =>
			instructorModel.findOne({ phoneNumber: phoneNumber }).then((result) => {
				if (result) {
					return Promise.reject(new Error("رقم الهاتف مستخدم من قبل !"));
				}
				return true;
			}),
		), // not duplicate

	// role
	body("role").optional().isString(),

	body("country")
		.notEmpty()
		.withMessage("الدولة مطلوبة")
		.isMongoId()
		.withMessage("invalid country id")
		.custom(async (countryId) => {
			const country = await countryModel.findById(countryId);

			if (!country) {
				throw new Error("هذه الدولة غير موجودة");
			}

			return true;
		}),

	validatorMiddleware,
];

const updateInstructorValidator = [
	param("id").isMongoId().withMessage("Invalid instructor id"),

	body("fullName")
		.optional()
		.isString()
		.withMessage("الاسم يجب أن يكون نص")
		.isLength({ min: 5 })
		.withMessage("الاسم لا يقل عن 5 حروف"),

	body("age")
		.optional()
		.isInt({ min: 16 })
		.withMessage("العمر يجب ألا يقل عن 16 سنة"),

	body("status")
		.optional()
		.isIn(["student", "graduate", "employed"])
		.withMessage("الحالة غير صحيحة"),

	body("currentJob")
		.optional()
		.isString()
		.withMessage("الوظيفة الحالية يجب أن تكون نص"),

	body("certifications")
		.optional()
		.isArray()
		.withMessage("الشهادات يجب أن تكون Array"),

	body("certifications.*")
		.optional()
		.isString()
		.withMessage("كل شهادة يجب أن تكون نص"),

	body("university")
		.optional()
		.isString()
		.withMessage("اسم الجامعة يجب أن يكون نص"),

	body("faculty")
		.optional()
		.isString()
		.withMessage("اسم الكلية يجب أن يكون نص"),

	body("specialization")
		.optional()
		.isString()
		.withMessage("التخصص يجب أن يكون نص"),

	body("email").optional().isEmail().withMessage("بريد إلكتروني غير صحيح"),

	body("phoneNumber")
		.optional()
		.isMobilePhone(["ar-EG", "ar-SA"])
		.withMessage("رقم الهاتف غير صحيح"),

	body("role").isEmpty().withMessage("ليس لديك الصلاحية لتعديل هذا"),

	body("country")
		.optional()
		.isMongoId()
		.withMessage("invalid county id")
		.custom(async (countryId) => {
			const country = await countryModel.findById(countryId);

			if (!country) {
				throw new Error("هذه الدولة غير موجودة");
			}

			return true;
		}),

	validatorMiddleware,
];

/* 
==================
	Student
=================
*/
const createStudentValidator = [
	// fullName
	body("fullName")
		.notEmpty()
		.withMessage("برجاء إدخال الاسم بالكامل")
		.isString()
		.withMessage("الاسم يجب أن يكون نص")
		.isLength({ min: 3 })
		.withMessage("الاسم لا يقل عن 3 حروف"),

	// university
	body("university")
		.notEmpty()
		.withMessage("برجاء إدخال اسم الجامعة")
		.isString()
		.withMessage("اسم الجامعة يجب أن يكون نص"),

	// faculty
	body("faculty")
		.notEmpty()
		.withMessage("برجاء إدخال اسم الكلية")
		.isString()
		.withMessage("اسم الكلية يجب أن يكون نص"),

	// specialization
	body("specialization")
		.optional()
		.isString()
		.withMessage("التخصص يجب أن يكون نص"),

	// year
	body("year")
		.notEmpty()
		.withMessage("برجاء تحديد السنة الدراسية")
		.isIn(["first", "second", "third", "fourth", "fifth", "sixth", "seventh"])
		.withMessage("السنة الدراسية يجب أن تكون بين first و seventh"),

	// email
	body("email")
		.notEmpty()
		.withMessage("برجاء إدخال البريد الإلكتروني")
		.isEmail()
		.withMessage("برجاء إدخال بريد إلكتروني صحيح")
		.custom((email) =>
			studentModel.findOne({ email }).then((student) => {
				if (student) {
					return Promise.reject(
						new Error("هذا البريد الإلكتروني مستخدم من قبل!"),
					);
				}
				return true;
			}),
		),

	// password
	body("password")
		.notEmpty()
		.withMessage("برجاء إدخال كلمة المرور")
		.isLength({ min: 6 })
		.withMessage("كلمة المرور لا تقل عن 6 حروف"),

	// phoneNumber
	body("phoneNumber")
		.notEmpty()
		.withMessage("برجاء إدخال رقم الهاتف")
		.isMobilePhone(["ar-EG"])
		.withMessage("برجاء إدخال رقم هاتف مصري صحيح")
		.custom((phoneNumber) =>
			studentModel.findOne({ phoneNumber }).then((student) => {
				if (student) {
					return Promise.reject(new Error("رقم الهاتف مستخدم من قبل!"));
				}
				return true;
			}),
		),

	body("country")
		.notEmpty()
		.withMessage("الدولة مطلوبة")
		.isMongoId()
		.withMessage("invalid county id")
		.custom(async (countryId) => {
			const country = await countryModel.findById(countryId);

			if (!country) {
				throw new Error("هذه الدولة غير موجودة");
			}

			return true;
		}),

	validatorMiddleware,
];

const updateStudentValidator = [
	param("id").isMongoId().withMessage("معرّف الطالب غير صحيح"),

	body("fullName")
		.optional()
		.isString()
		.withMessage("الاسم يجب أن يكون نص")
		.isLength({ min: 3 })
		.withMessage("الاسم لا يقل عن 3 حروف"),

	body("university")
		.optional()
		.isString()
		.withMessage("اسم الجامعة يجب أن يكون نص"),

	body("faculty")
		.optional()
		.isString()
		.withMessage("اسم الكلية يجب أن يكون نص"),

	body("specialization")
		.optional()
		.isString()
		.withMessage("التخصص يجب أن يكون نص"),

	body("year")
		.optional()
		.isIn(["first", "second", "third", "fourth", "fifth", "sixth", "seventh"])
		.withMessage("السنة الدراسية غير صحيحة"),

	body("email").optional().isEmail().withMessage("بريد إلكتروني غير صحيح"),

	body("phoneNumber")
		.optional()
		.isMobilePhone(["ar-EG", "ar-SA"])
		.withMessage("رقم الهاتف غير صحيح"),

	body("role").isEmpty().withMessage("role ليس لديك الصلاحية لتعديل"),

	body("country")
		.optional()
		.isMongoId()
		.withMessage("invalid county id")
		.custom(async (countryId) => {
			const country = await countryModel.findById(countryId);

			if (!country) {
				throw new Error("هذه الدولة غير موجودة");
			}

			return true;
		}),

	validatorMiddleware,
];

/* 
==================
	Common
=================
*/
// for delete and getOne
const getIdValidator = [
	param("id").isMongoId().withMessage("Invalid ID format"),

	validatorMiddleware,
];

const changeUserPasswordValidator = [
	param("id").isMongoId().withMessage("Invalid ID format"),

	body("newPassword")
		.notEmpty()
		.withMessage("كلمة المرور الجديدة مطلوبة ")
		.isLength({ min: 6 })
		.withMessage("كلمة المرور لا تقل عن 6 حروف"),

	validatorMiddleware,
];

const changeLoggedUserPasswordValidator = [
	body("currentPassword")
		.notEmpty()
		.withMessage("كلمة المرور الحالية مطلوبة")
		.custom(async (cp, { req }) => {
			//check current password
			const isCorrectPassword = await bcrypt.compare(cp, req.user.password);
			if (!isCorrectPassword) {
				throw new Error("كلمة المرور الحالية غير صحيحة");
			}
			return true;
		}),
	body("newPassword").notEmpty().withMessage("كلمة المرور الجديدة مطلوبة"),
	body("newPasswordConfirm")
		.notEmpty()
		.withMessage("تأكيد كلمة المرور الجديدة مطلوب")
		.custom((val, { req }) => {
			if (req.body.newPassword !== val) {
				throw new Error("تأكيد كلمة المرور لا يطابق كلمة المرور الجديدة");
			}
			return true;
		}),
	validatorMiddleware,
];

const updateLoggedUsersValidator = [
	body("fullName").optional(),
	check("email")
		.optional()
		.isEmail()
		.withMessage("البريد الإلكتروني غير صالح")
		.custom((email) =>
			instructorModel.findOne({ email }).then((result) => {
				if (result) {
					return Promise.reject(new Error("البريد الإلكتروني مستخدم بالفعل"));
				}
				return true;
			}),
		),
	check("phone")
		.optional()
		.isMobilePhone(["ar-EG", "ar-SA"])
		.withMessage("رقم الهاتف غير صالح. مسموح فقط أرقام مصر أو السعودية"),
	validatorMiddleware,
];

module.exports = {
	createInstructorValidator,
	updateInstructorValidator,

	createStudentValidator,
	updateStudentValidator,

	getIdValidator,
	changeUserPasswordValidator,
	changeLoggedUserPasswordValidator,
	updateLoggedUsersValidator,
};
