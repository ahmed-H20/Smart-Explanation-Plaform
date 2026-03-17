const asyncHandler = require("express-async-handler");
const {
	createSubscription,
	getMySubscriptions,
	cancelSubscription,
	getSubscriptionById,
	getAllSubscriptions,
} = require("../services/subscriptionService");

/**
 * @desc    Subscribe the authenticated student to a plan
 * @route   POST /api/v1/subscriptions
 * @access  Private (Student)
 * @body    { planId, majorId }
 */
const subscribe = asyncHandler(async (req, res) => {
	const studentId = req.user._id;
	const { planId, majorId } = req.body;

	if (!planId) {
		return res
			.status(400)
			.json({ status: "fail", message: "planId is required" });
	}
	if (!majorId) {
		return res
			.status(400)
			.json({ status: "fail", message: "majorId is required" });
	}

	const subscription = await createSubscription({ studentId, planId, majorId });

	res.status(201).json({
		status: "success",
		data: subscription,
	});
});

/**
 * @desc    Get all subscriptions (admin view, supports ?status= and ?studentId= filters)
 * @route   GET /api/v1/subscriptions
 * @access  Private (Admin)
 */
const getSubscriptionsHandler = asyncHandler(async (req, res) => {
	const { status, studentId } = req.query;

	const subscriptions = await getAllSubscriptions({ status, studentId });

	res.status(200).json({
		status: "success",
		results: subscriptions.length,
		data: subscriptions,
	});
});

/**
 * @desc    Get all subscriptions for the authenticated student
 * @route   GET /api/v1/subscriptions/me
 * @access  Private (Student)
 */
const getMySubscriptionsHandler = asyncHandler(async (req, res) => {
	const studentId = req.user._id;

	const subscriptions = await getMySubscriptions(studentId);

	res.status(200).json({
		status: "success",
		results: subscriptions.length,
		data: subscriptions,
	});
});

/**
 * @desc    Get a single subscription by ID
 * @route   GET /api/v1/subscriptions/:id
 * @access  Private (Admin or owning Student)
 */
const getSubscriptionHandler = asyncHandler(async (req, res) => {
	const subscription = await getSubscriptionById(req.params.id, req.user);

	res.status(200).json({
		status: "success",
		data: subscription,
	});
});

/**
 * @desc    Cancel an active subscription
 * @route   PATCH /api/v1/subscriptions/:id/cancel
 * @access  Private (Student)
 */
const cancelSubscriptionHandler = asyncHandler(async (req, res) => {
	const studentId = req.user._id;
	const subscriptionId = req.params.id;

	const subscription = await cancelSubscription(subscriptionId, studentId);

	res.status(200).json({
		status: "success",
		data: subscription,
	});
});

module.exports = {
	subscribe,
	getSubscriptionsHandler,
	getMySubscriptionsHandler,
	getSubscriptionHandler,
	cancelSubscriptionHandler,
};
