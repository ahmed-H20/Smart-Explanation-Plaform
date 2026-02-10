const mongoose = require("mongoose");

const countrySchema = mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, "Country name is required"],
			unique: true,
		},
		code: {
			type: String,
			trim: true,
			required: [true, "Country code is required"],
			uppercase: true,
			unique: true,
		},
		phoneCode: {
			type: String,
			trim: true,
		},
		currencyCode: {
			type: String,
			trim: true,
			required: [true, "Country currency code is required"],
			uppercase: true,
		},
		currencyName: {
			type: String,
			trim: true,
			required: [true, "Country currency name is required"],
		},
		currencySymbol: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	},
);

const countryModel = mongoose.model("Country", countrySchema);
module.exports = countryModel;
