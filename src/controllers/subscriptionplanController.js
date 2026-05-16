const asyncHandler = require("express-async-handler");
const SubscriptionPlan = require("../models/SubscriptionplanModel");
const ApiError = require("../utils/ApiError");
const { getDocument, getAllDocuments } = require("./handlerFactory");

/**
 * @desc    Get all subscription plans (active only for public; pass ?all=true for admin)
 * @route   GET /api/v1/subscription-plans
 * @access  Public
 */ //DONE
const getSubscriptionPlans = getAllDocuments(
	SubscriptionPlan,
	SubscriptionPlan.modelName,
);

/**
 * @desc    Get a single subscription plan by ID
 * @route   GET /api/v1/subscription-plans/:id
 * @access  Public
 */ //DONE
const getSubscriptionPlan = getDocument(
	SubscriptionPlan,
	SubscriptionPlan.modelName,
);

/**
 * @desc    Create a new subscription plan
 * @route   POST /api/v1/subscription-plans
 * @access  Private (Admin)
 */ //DONE
const createSubscriptionPlan = asyncHandler(async (req, res) => {
	if (!req.body.countries) {
		req.body.countries = [];
	}

	const plan = await SubscriptionPlan.create({
		...req.body,
		availableForAll: req.body.countries.length === 0,
	});

	res.status(201).json({
		status: "success",
		data: plan,
	});
});

/**
 * @desc    Update a subscription plan
 * @route   PUT /api/v1/subscription-plans/:id
 * @access  Private (Admin)
 */ //DONE
const updateSubscriptionPlan = asyncHandler(async (req, res) => {
	const plan = await SubscriptionPlan.findByIdAndUpdate(
		req.params.id,
		req.body,
		{ new: true, runValidators: true },
	);

	if (!plan) {
		throw new ApiError("Subscription plan not found", 404);
	}

	res.status(200).json({
		status: "success",
		data: plan,
	});
});

/**
 * @desc    Soft-delete (deactivate) a subscription plan.
 *          Hard delete is avoided to preserve historical subscription records.
 * @route   DELETE /api/v1/subscription-plans/:id
 * @access  Private (Admin)
 */ //DONE
const deleteSubscriptionPlan = asyncHandler(async (req, res) => {
	const plan = await SubscriptionPlan.findByIdAndUpdate(
		req.params.id,
		{ isActive: false },
		{ new: true },
	);

	if (!plan) {
		throw new ApiError("Subscription plan not found", 404);
	}

	res.status(200).json({
		message: "Subscription plan deactivated successfully",
	});
});

module.exports = {
	getSubscriptionPlans,
	getSubscriptionPlan,
	createSubscriptionPlan,
	updateSubscriptionPlan,
	deleteSubscriptionPlan,
};
