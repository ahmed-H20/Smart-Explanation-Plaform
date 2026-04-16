const express = require("express");
const {
	createHourPrice,
	getAllHourPrice,
	getHourPriceById,
	updateHourPrice,
	deleteHourPrice,
	getPricingByCountry,
} = require("../controllers/CountryHourlyPricingController");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createPricingValidator,
	updatePricingValidator,
	pricingIdValidator,
	countryIdValidator,
} = require("../utils/validators/Countryhourlypricingvalidator");

const router = express.Router();

router.use(protect(), allowedTo("admin"));

router
	.route("/")
	.post(createPricingValidator, createHourPrice)
	.get(getAllHourPrice);

router
	.route("/country/:countryId")
	.get(countryIdValidator, getPricingByCountry);

router
	.route("/:id")
	.get(pricingIdValidator, getHourPriceById)
	.patch(updatePricingValidator, updateHourPrice)
	.delete(deleteHourPrice);

module.exports = router;
