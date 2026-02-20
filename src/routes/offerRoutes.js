const express = require("express");
const {
	getUploadVideoUrl,
	handleMuxWebhook,
	createOffer,
	getAllOffers,
	getLoggedInstructorOffers,
	getOffersForRequest,
	getOffer,
	updateOffer,
	deleteOffer,
	cancelOffer,
	acceptOffer,
	uploadFiles,
	fileLocalUpdate,
} = require("../controllers/offerController");
const { protect, allowedTo } = require("../controllers/authController");
// const {
// 	createCountryValidator,
// 	updateCountryValidator,
// 	countryIdValidator,
// } = require("../utils/validators/countryValidator");

const router = express.Router();
router.post("/mux_webhook", handleMuxWebhook);

router.use(protect());

router.get(
	"/createUploadUrl/:offerId",
	allowedTo("instructor"),
	getUploadVideoUrl,
);

router
	.route("/")
	.post(allowedTo("instructor"), createOffer)
	.get(allowedTo("admin"), getAllOffers);

router.get("/me", allowedTo("instructor"), getLoggedInstructorOffers);
router
	.route("/:id")
	.get(getOffer)
	.patch(allowedTo("instructor"), updateOffer)
	.delete(allowedTo("admin"), deleteOffer);
router.get(
	"/:requestId",
	allowedTo("student", "instructor"),
	getOffersForRequest,
);
router.patch("/:id/cancel", allowedTo("instructor"), cancelOffer);
router.patch(
	"/:id/accept",
	allowedTo("student"),
	uploadFiles,
	fileLocalUpdate,
	acceptOffer,
);

module.exports = router;
