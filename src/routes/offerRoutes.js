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
	setEstimatedTimeAndPrice,
} = require("../controllers/offerController");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createOfferValidator,
	// updateOfferValidator,
	offerIdValidator,
	getOffersForRequestValidator,
	cancelOfferValidator,
	acceptOfferValidator,
	deleteOfferValidator,
	getUploadVideoUrlValidator,
	setEstimatedTimeAndPriceValidator,
} = require("../utils/validators/offerValidator");

const router = express.Router();
router.post("/mux_webhook", handleMuxWebhook);

router.use(protect());

router.get(
	"/createUploadUrl/:offerId",
	allowedTo("instructor"),
	getUploadVideoUrlValidator,
	getUploadVideoUrl,
);

router
	.route("/")
	.post(allowedTo("instructor"), createOfferValidator, createOffer)
	.get(allowedTo("admin"), getAllOffers);

router.get("/me", allowedTo("instructor"), getLoggedInstructorOffers);
router.get(
	"/request/:requestId",
	allowedTo("student", "instructor"),
	getOffersForRequestValidator,
	getOffersForRequest,
);
router
	.route("/:id")
	.get(offerIdValidator, getOffer)
	// .patch(allowedTo("instructor"), updateOffer)
	.delete(allowedTo("admin"), deleteOfferValidator, deleteOffer);
router.patch(
	"/cancel/:id",
	allowedTo("instructor"),
	cancelOfferValidator,
	cancelOffer,
);
router.patch(
	"/:id/accept",
	allowedTo("student"),
	uploadFiles,
	fileLocalUpdate,
	acceptOfferValidator,
	acceptOffer,
);
router.patch(
	"/:id/estimatedTimeAndPrice",
	allowedTo("instructor"),
	setEstimatedTimeAndPriceValidator,
	setEstimatedTimeAndPrice,
);

module.exports = router;
