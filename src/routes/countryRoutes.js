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

router
	.route("/")
	.post(protect(), allowedTo("admin"), createCountryValidator, createCountry)
	.get(getAllCountry);
router
	.route("/:id")
	.get(countryIdValidator, getCountryById)
	.patch(protect(), allowedTo("admin"), updateCountryValidator, updateCountry)
	.delete(protect(), allowedTo("admin"), countryIdValidator, deleteCountry);

module.exports = router;
