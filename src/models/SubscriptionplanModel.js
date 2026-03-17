const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Plan name is required"],
			trim: true,
			unique: true,
		},
		durationDays: {
			type: Number,
			required: [true, "Duration in days is required"],
			min: [1, "Duration must be at least 1 day"],
		},
		price: {
			type: Number,
			required: [true, "Plan price is required"],
			min: [0, "Price cannot be negative"],
		},
		currency: {
			type: String,
			required: [true, "Currency is required"],
			trim: true,
			uppercase: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

// Index for fast lookups of active plans
subscriptionPlanSchema.index({ isActive: 1 });

//TODO : find active only middleware

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
