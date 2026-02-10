const { body, param } = require("express-validator");
const countryModel = require("../../models/countryModel");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

/* =========================
   CREATE COUNTRY
========================= */
const createCountryValidator = [
	// name
	body("name")
		.notEmpty()
		.withMessage("برجاء إدخال اسم الدولة")
		.isString()
		.withMessage("اسم الدولة يجب أن يكون نص")
		.custom((name) =>
			countryModel.findOne({ name }).then((country) => {
				if (country) {
					return Promise.reject(new Error("اسم الدولة موجود بالفعل"));
				}
				return true;
			}),
		),

	// code
	body("code")
		.notEmpty()
		.withMessage("برجاء إدخال كود الدولة")
		.isLength({ min: 2, max: 3 })
		.withMessage("كود الدولة يجب أن يكون من 2 إلى 3 حروف")
		.isAlpha()
		.withMessage("كود الدولة يجب أن يحتوي على حروف فقط")
		.custom((code) =>
			countryModel.findOne({ code: code.toUpperCase() }).then((country) => {
				if (country) {
					return Promise.reject(new Error("كود الدولة مستخدم من قبل"));
				}
				return true;
			}),
		),

	// phoneCode
	body("phoneCode")
		.optional()
		.matches(/^\+\d{1,4}$/)
		.withMessage("كود الهاتف يجب أن يكون مثل +20 أو +966"),

	// currencyCode
	body("currencyCode")
		.notEmpty()
		.withMessage("برجاء إدخال كود العملة")
		.isLength({ min: 3, max: 3 })
		.withMessage("كود العملة يجب أن يكون 3 حروف")
		.isAlpha()
		.withMessage("كود العملة يجب أن يحتوي على حروف فقط"),

	// currencyName
	body("currencyName")
		.notEmpty()
		.withMessage("برجاء إدخال اسم العملة")
		.isString()
		.withMessage("اسم العملة يجب أن يكون نص"),

	// currencySymbol
	body("currencySymbol")
		.optional()
		.isString()
		.withMessage("رمز العملة يجب أن يكون نص"),

	validatorMiddleware,
];

/* =========================
   UPDATE COUNTRY
========================= */
const updateCountryValidator = [
	param("id").isMongoId().withMessage("معرّف الدولة غير صحيح"),

	body("name").optional().isString().withMessage("اسم الدولة يجب أن يكون نص"),

	body("code")
		.optional()
		.isLength({ min: 2, max: 3 })
		.withMessage("كود الدولة غير صحيح")
		.isAlpha()
		.withMessage("كود الدولة يجب أن يكون حروف فقط"),

	body("phoneCode")
		.optional()
		.matches(/^\+\d{1,4}$/)
		.withMessage("كود الهاتف غير صحيح"),

	body("currencyCode")
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage("كود العملة غير صحيح")
		.isAlpha()
		.withMessage("كود العملة يجب أن يكون حروف فقط"),

	body("currencyName")
		.optional()
		.isString()
		.withMessage("اسم العملة يجب أن يكون نص"),

	body("currencySymbol")
		.optional()
		.isString()
		.withMessage("رمز العملة يجب أن يكون نص"),

	validatorMiddleware,
];

/* =========================
   ID VALIDATOR (GET / DELETE)
========================= */
const countryIdValidator = [
	param("id").isMongoId().withMessage("معرّف الدولة غير صحيح"),
	validatorMiddleware,
];

module.exports = {
	createCountryValidator,
	updateCountryValidator,
	countryIdValidator,
};
