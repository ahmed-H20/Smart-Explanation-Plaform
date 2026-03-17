const { check, param } = require("express-validator");

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

	check("durationDays")
		.notEmpty()
		.withMessage("durationDays is required")
		.isInt({ min: 1 })
		.withMessage("durationDays must be a positive integer"),

	check("price")
		.notEmpty()
		.withMessage("price is required")
		.isFloat({ min: 0 })
		.withMessage("price must be a positive number"),

	check("currency")
		.notEmpty()
		.withMessage("currency is required")
		.isLength({ min: 2, max: 5 })
		.withMessage("currency must be valid (ex: EGP, USD)"),

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

	check("durationDays")
		.optional()
		.isInt({ min: 1 })
		.withMessage("durationDays must be a positive integer"),

	check("price")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("price must be a positive number"),

	check("currency")
		.optional()
		.isLength({ min: 2, max: 5 })
		.withMessage("currency must be valid (ex: EGP, USD)"),

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
