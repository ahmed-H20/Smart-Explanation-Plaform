const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Plan name is required"],
			trim: true,
			unique: true,
		},
		numberOfHours: {
			type: Number,
			required: [true, "Duration in days is required"],
			min: [1, "Duration must be at least 1 day"],
		},
		priceUSD: {
			type: Number,
			required: [true, "Plan price is required"],
			min: [0, "Price cannot be negative"],
		},
		availableForAll: {
			type: Boolean,
			default: true,
		},
		countries: [
			{
				type: mongoose.Schema.ObjectId,
				ref: "Country",
			},
		],
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

//find active only middleware
subscriptionPlanSchema.pre(/^find/, function () {
	// If the query has ?all=true, skip filtering by isActive
	if (this.getQuery().all) {
		delete this.getQuery().all; // Remove the all parameter from the query
		return;
	}

	// Otherwise, only return active plans
	this.find({ isActive: true });
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
