const express = require("express");
const {
	getUploadVideoUrl,
	handleMuxWebhook,
} = require("../controllers/offerController");
// const instructorModel = require("../models/instructorsModel");
// const { protect, allowedTo } = require("../controllers/authController");
// const {
// 	createCountryValidator,
// 	updateCountryValidator,
// 	countryIdValidator,
// } = require("../utils/validators/countryValidator");

const router = express.Router();

router.get("/createUploadUrl/:offerId", getUploadVideoUrl);
router.post("/mux_webhook", handleMuxWebhook);
module.exports = router;
