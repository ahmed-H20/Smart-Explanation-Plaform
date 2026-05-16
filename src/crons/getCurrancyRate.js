const { default: axios } = require("axios");
const cron = require("node-cron");
const CurrencyRate = require("../models/currencyRateModel");

const updateRate = cron.schedule("* 0 * * *", async () => {
	const res = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");

	const currency = await CurrencyRate.updateOne(
		{ base: "USD" },
		{ rates: res.data.rates, updatedAt: new Date() },
		{ upsert: true },
	);
});

module.exports = updateRate;
