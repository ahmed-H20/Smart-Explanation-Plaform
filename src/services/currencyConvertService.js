const CurrencyRate = require("../models/currencyRateModel");

async function convertFromUSD(amountUSD, toCurrency) {
	const currency = await CurrencyRate.findOne({ base: "USD" });

	if (!currency) return amountUSD;

	const rate = currency.rates[toCurrency];

	if (!rate) return amountUSD;

	return amountUSD * rate;
}

module.exports = {
	convertFromUSD,
};
