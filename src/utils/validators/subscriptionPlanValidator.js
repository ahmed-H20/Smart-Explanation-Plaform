const { check, param } = require("express-validator");
const mongoose = require("mongoose");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const SubscriptionPlan = require("../../models/SubscriptionplanModel");

/**
 * @desc   Validate create subscription plan
 */
exports.createSubscriptionPlanValidator = [
	check("name")
		.notEmpty()
		.withMessage("Plan name is required")
		.isLength({ min: 2 })
		.withMessage("Plan name must be at least 2 characters long"),

	check("numberOfHours")
		.notEmpty()
		.withMessage("numberOfHours is required")
		.isInt({ min: 1 })
		.withMessage("numberOfHours must be a positive integer"),

	check("priceUSD")
		.notEmpty()
		.withMessage("priceUSD is required")
		.isFloat({ min: 0 })
		.withMessage("priceUSD must be a positive number"),

	check("countries")
		.optional()
		.isArray()
		.withMessage("countries must be an array of country IDs"),

	check("countries.*")
		.optional()
		.custom((countryId) => {
			if (!mongoose.Types.ObjectId.isValid(countryId)) {
				throw new Error(`Invalid country id: ${countryId}`);
			}
			return true;
		}),

	check("isActive")
		.optional()
		.isBoolean()
		.withMessage("isActive must be boolean"),

	validatorMiddleware,
];

/**
 * @desc   Validate update subscription plan
 */
exports.updateSubscriptionPlanValidator = [
	param("id").isMongoId().withMessage("Invalid subscription plan id"),

	check("name")
		.optional()
		.isLength({ min: 2 })
		.withMessage("Plan name must be at least 2 characters long"),

	check("numberOfHours")
		.optional()
		.isInt({ min: 1 })
		.withMessage("number Of Hours must be a positive integer"),

	check("priceUSD")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("priceUSD must be a positive number"),

	check("availableForAll")
		.optional()
		.isBoolean()
		.withMessage("availableForAll must be boolean"),

	check("countries").custom((value, { req }) => {
		// ✅ if available for all => countries must be empty
		if (req.body.availableForAll === true) {
			if (Array.isArray(value) && value.length > 0) {
				throw new Error(
					"countries must be an empty array when availableForAll is true",
				);
			}
		}

		// ✅ if NOT available for all => countries required
		if (req.body.availableForAll === false) {
			if (!Array.isArray(value) || value.length === 0) {
				throw new Error("countries is required when availableForAll is false");
			}

			value.forEach((countryId) => {
				if (!mongoose.Types.ObjectId.isValid(countryId)) {
					throw new Error(`Invalid country id: ${countryId}`);
				}
			});
		}

		return true;
	}),

	check("isActive")
		.optional()
		.isBoolean()
		.withMessage("isActive must be boolean"),

	validatorMiddleware,
];

/**
 * @desc   Validate get/delete subscription plan
 */
exports.getSubscriptionPlanValidator = [
	param("id").isMongoId().withMessage("Invalid subscription plan id"),
	validatorMiddleware,
];
