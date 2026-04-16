const mongoose = require("mongoose");

const countryHourlyPricingSchema = new mongoose.Schema({
	countryId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Country",
		required: true,
		unique: true,
	},

	studentHourlyRateUSD: {
		type: Number,
		required: true,
	},

	instructorHourlyRateUSD: {
		type: Number,
		required: true,
	},

	platformFeePercentage: {
		type: Number,
	}, //optional

	createdAt: {
		type: Date,
		default: Date.now,
	},

	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// update updatedAt automatically
countryHourlyPricingSchema.pre("save", function () {
	this.updatedAt = Date.now();
});

module.exports = mongoose.model(
	"CountryHourlyPricing",
	countryHourlyPricingSchema,
);
