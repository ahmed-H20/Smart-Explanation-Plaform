const express = require("express");

const {
	createNotification,
	getAllNotifications,
	getUserNotifications,
	getNotification,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
	sendSystemNotificationToInstructors,
	sendSystemNotificationToStudents,
} = require("../controllers/notificationsController");
const { protect, allowedTo } = require("../controllers/authController");

const router = express.Router();
router.use(protect());

router
	.route("/")
	.post(allowedTo("admin"), createNotification)
	.get(allowedTo("admin"), getAllNotifications);
router
	.route("/sendToAllInstructors")
	.post(allowedTo("admin"), sendSystemNotificationToInstructors);
router
	.route("/sendToAllStudents")
	.post(allowedTo("admin"), sendSystemNotificationToStudents);
router.route("/me").get(getUserNotifications);
router.route("/me/mark-all-read").patch(markAllNotificationsAsRead);
router
	.route("/:id")
	.get(getNotification)
	.patch(markNotificationAsRead)
	.delete(deleteNotification);

module.exports = router;
