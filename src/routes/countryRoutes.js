const express = require("express");
const {
	createCountry,
	getAllCountry,
	getCountryById,
	updateCountry,
	deleteCountry,
} = require("../controllers/countryController");
const instructorModel = require("../models/instructorsModel");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createCountryValidator,
	updateCountryValidator,
	countryIdValidator,
} = require("../utils/validators/countryValidator");

const router = express.Router();

router.use(protect());

router
	.route("/")
	.post(allowedTo("admin"), createCountryValidator, createCountry)
	.get(getAllCountry);
router
	.route("/:id")
	.get(countryIdValidator, getCountryById)
	.patch(updateCountryValidator, allowedTo("admin"), updateCountry)
	.delete(allowedTo("admin"), countryIdValidator, deleteCountry);

module.exports = router;
