const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
	{
		studentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: [true, "Student ID is required"],
		},
		planId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "SubscriptionPlan",
			required: [true, "Plan ID is required"],
		},
		numberOfHours: {
			type: Number,
		},
		status: {
			type: String,
			enum: ["active", "cancelled", "expired"],
			default: "active",
		},
		startDate: {
			type: Date,
			required: [true, "Start date is required"],
		},
		endDate: {
			type: Date,
		},
		paymentStatus: {
			type: String,
			enum: ["paid", "failed", "refunded"],
			default: "paid",
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

// Prevent duplicate active subscriptions for the same student + same plan
// A student cannot subscribe to the same plan twice while one is still active
subscriptionSchema.index(
	{ studentId: 1, planId: 1, status: 1 },
	{
		unique: true,
		partialFilterExpression: { status: "active" },
		name: "unique_active_student_plan",
	},
);

// Fast lookups by student
subscriptionSchema.index({ studentId: 1, status: 1 });

// Useful for expiry cron jobs
subscriptionSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
