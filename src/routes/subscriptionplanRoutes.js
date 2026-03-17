const express = require("express");
const {
	getSubscriptionPlans,
	getSubscriptionPlan,
	createSubscriptionPlan,
	updateSubscriptionPlan,
	deleteSubscriptionPlan,
} = require("../controllers/subscriptionplanController");
const { allowedTo, protect } = require("../controllers/authController");
const {
	updateSubscriptionPlanValidator,
	createSubscriptionPlanValidator,
	getSubscriptionPlanValidator,
} = require("../utils/validators/subscriptionPlanValidator");

const router = express.Router();

// Public routes
router.get("/", getSubscriptionPlans);
router.get("/:id", getSubscriptionPlanValidator, getSubscriptionPlan);

// Admin-only routes
router.use(protect());
router.use(allowedTo("admin"));

router.post("/", createSubscriptionPlanValidator, createSubscriptionPlan);
router.put("/:id", updateSubscriptionPlanValidator, updateSubscriptionPlan);
router.delete("/:id", getSubscriptionPlanValidator, deleteSubscriptionPlan);

module.exports = router;
