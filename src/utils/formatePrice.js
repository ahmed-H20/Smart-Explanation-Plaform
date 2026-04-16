const { convertFromUSD } = require("../services/currencyConvertService");

async function formatPrice(amountUSD, user) {
	const currency = user.country.currencyCode || "USD";

	const price = await convertFromUSD(amountUSD, currency);

	return {
		amount: Math.round(price * 100) / 100,
		currency,
	};
}

module.exports = formatPrice;
