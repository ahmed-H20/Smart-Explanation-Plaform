const express = require("express");
const {
	createOrder,
	finishAndSubmitOrder,
	getAllOrders,
	getOrder,
	getLoggedUserOrders,
	fileLocalUpdate,
	uploadFiles,
	uploadDocs,
	uploadQuizzes,
	handleMuxWebhook,
	getUploadVideoUrl,
	getLoggedUserVideos,
} = require("../controllers/orderController");
const {
	createOrderValidator,
	finishAndSubmitOrderValidator,
	getOrderValidator,
	uploadDocsValidator,
	getUploadVideoUrlValidator,
} = require("../utils/validators/orderValidator");
const { protect, allowedTo } = require("../controllers/authController");

const router = express.Router();

router.post("/mux_webhook", handleMuxWebhook);

router.get(
	"/createUploadUrl/:orderId",
	protect(),
	allowedTo("instructor"),
	getUploadVideoUrlValidator,
	getUploadVideoUrl,
);

router.get(
	"/getMyVideos",
	protect(),
	allowedTo("student", "instructor"),
	getLoggedUserVideos,
);

router.get(
	"/me",
	protect(),
	allowedTo("student", "instructor"),
	getLoggedUserOrders,
);

router
	.route("/")
	.post(protect(), allowedTo("student"), createOrderValidator, createOrder)
	.get(protect(), allowedTo("admin"), getAllOrders);

router.put(
	"/submit/:id",
	protect(),
	allowedTo("instructor"),
	finishAndSubmitOrderValidator,
	finishAndSubmitOrder,
);

router.put(
	"/uploadDocs/:id",
	protect(),
	allowedTo("instructor"),
	uploadFiles,
	fileLocalUpdate,
	uploadDocsValidator,
	uploadDocs,
);

router.put(
	"/uploadQuizzes/:id",
	protect(),
	allowedTo("instructor"),
	uploadFiles,
	fileLocalUpdate,
	uploadDocsValidator,
	uploadQuizzes,
);

router.route("/:id").get(protect(), getOrderValidator, getOrder);

module.exports = router;
