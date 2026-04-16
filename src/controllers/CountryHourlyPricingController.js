const {
	createDocument,
	getAllDocuments,
	getDocument,
	updateDocument,
	deleteDocument,
} = require("./handlerFactory");
const Model = require("../models/CountryHourlyPricingModel");
const CountryHourlyPricing = require("../models/CountryHourlyPricingModel");

const documentName = "HourPrice";

// @desc create new HourPrice
// @route POST /api/v1/HourPrices
// @access private
const createHourPrice = createDocument(Model, documentName);

// @desc get all HourPrices
// @route GET /api/v1/HourPrices
// @access private admin
const getAllHourPrice = getAllDocuments(Model, documentName);

// @desc get one HourPrice
// @route GET /api/v1/HourPrices/:id
// @access private admin
const getHourPriceById = getDocument(Model, documentName);

// @desc update one HourPrice
// @route PATCH /api/v1/HourPrices/:id
// @access private admin
const updateHourPrice = updateDocument(Model, documentName);

// @desc delete one HourPrice
// @route DELETE /api/v1/HourPrices/:id
// @access private admin
const deleteHourPrice = deleteDocument(Model, documentName);

// @desc    Get pricing by countryId
// @route   GET /api/country-hourly-pricing/country/:countryId
// @access private admin
const getPricingByCountry = async (req, res) => {
	try {
		const pricing = await CountryHourlyPricing.findOne({
			countryId: req.params.countryId,
		}).populate("countryId", "name code");

		if (!pricing) {
			return res.status(404).json({
				success: false,
				message: "Pricing not found for this country",
			});
		}

		return res.status(200).json({ success: true, data: pricing });
	} catch (error) {
		if (error.name === "CastError") {
			return res
				.status(400)
				.json({ success: false, message: "Invalid country ID" });
		}
		return res
			.status(500)
			.json({ success: false, message: "Server error", error: error.message });
	}
};

module.exports = {
	createHourPrice,
	getAllHourPrice,
	getHourPriceById,
	updateHourPrice,
	deleteHourPrice,
	getPricingByCountry,
};
