const mongoose = require("mongoose");

const currencyRateSchema = mongoose.Schema(
	{
		base: String, // "USD"

		rates: Object,
		// {
		//   EGP: 50.2,
		//   SAR: 3.75,
		//   EUR: 0.92
		// }
	},
	{
		timestamps: true,
	},
);

module.exports = mongoose.model("CurrencyRate", currencyRateSchema);
