const { body, param } = require("express-validator");
const CountryHourlyPricing = require("../../models/CountryHourlyPricingModel");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

/* =========================
   CREATE PRICING
========================= */
const createPricingValidator = [
	// countryId
	body("countryId")
		.notEmpty()
		.withMessage("برجاء إدخال معرّف الدولة")
		.isMongoId()
		.withMessage("معرّف الدولة غير صحيح")
		.custom((countryId) =>
			CountryHourlyPricing.findOne({ countryId }).then((pricing) => {
				if (pricing) {
					return Promise.reject(
						new Error("يوجد تسعير مسجّل لهذه الدولة بالفعل"),
					);
				}
				return true;
			}),
		),

	// studentHourlyRateUSD
	body("studentHourlyRateUSD")
		.notEmpty()
		.withMessage("برجاء إدخال سعر ساعة الطالب")
		.isFloat({ min: 0 })
		.withMessage("سعر ساعة الطالب يجب أن يكون رقماً موجباً"),

	// instructorHourlyRateUSD
	body("instructorHourlyRateUSD")
		.notEmpty()
		.withMessage("برجاء إدخال سعر ساعة المدرّب")
		.isFloat({ min: 0 })
		.withMessage("سعر ساعة المدرّب يجب أن يكون رقماً موجباً"),

	// platformFeePercentage
	body("platformFeePercentage")
		.optional()
		.isFloat({ min: 0, max: 100 })
		.withMessage("نسبة رسوم المنصة يجب أن تكون بين 0 و 100"),

	validatorMiddleware,
];

/* =========================
   UPDATE PRICING
========================= */
const updatePricingValidator = [
	param("id").isMongoId().withMessage("معرّف التسعير غير صحيح"),

	// studentHourlyRateUSD
	body("studentHourlyRateUSD")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("سعر ساعة الطالب يجب أن يكون رقماً موجباً"),

	// instructorHourlyRateUSD
	body("instructorHourlyRateUSD")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("سعر ساعة المدرّب يجب أن يكون رقماً موجباً"),

	// platformFeePercentage
	body("platformFeePercentage")
		.optional()
		.isFloat({ min: 0, max: 100 })
		.withMessage("نسبة رسوم المنصة يجب أن تكون بين 0 و 100"),

	validatorMiddleware,
];

/* =========================
   ID VALIDATOR (GET / DELETE)
========================= */
const pricingIdValidator = [
	param("id").isMongoId().withMessage("معرّف التسعير غير صحيح"),
	validatorMiddleware,
];

/* =========================
   COUNTRY ID VALIDATOR (GET BY COUNTRY)
========================= */
const countryIdValidator = [
	param("countryId").isMongoId().withMessage("معرّف الدولة غير صحيح"),
	validatorMiddleware,
];

module.exports = {
	createPricingValidator,
	updatePricingValidator,
	pricingIdValidator,
	countryIdValidator,
};
