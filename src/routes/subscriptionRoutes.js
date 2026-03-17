const express = require("express");
const {
	subscribe,
	getMySubscriptionsHandler,
	cancelSubscriptionHandler,
	getSubscriptionHandler,
	getSubscriptionsHandler,
} = require("../controllers/subscriptionController");

// Replace with your actual auth middleware
const { protect, allowedTo } = require("../controllers/authController");

const router = express.Router();

// All subscription routes require an authenticated student
router.use(protect());

// POST /api/v1/subscriptions
router.post("/", allowedTo("student"), subscribe);

// GET /api/v1/subscriptions/me
router.get("/me", allowedTo("student"), getMySubscriptionsHandler);

// PATCH /api/v1/subscriptions/:id/cancel
router.patch("/:id/cancel", allowedTo("student"), cancelSubscriptionHandler);

// GET /api/v1/subscriptions/:id
router.get("/:id", allowedTo("admin", "student"), getSubscriptionHandler);

// ── Admin-only routes ─────────────────────────────────────────────────────────

// GET /api/v1/subscriptions  — list all with optional ?status= & ?studentId= filters
router.get("/", allowedTo("admin"), getSubscriptionsHandler);

module.exports = router;
