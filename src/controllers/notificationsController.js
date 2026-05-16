const asyncHandler = require("express-async-handler");

const {
	createDocument,
	getAllDocuments,
	getDocument,
} = require("./handlerFactory");
const Model = require("../models/notificationModel");
const { sendNotification } = require("../utils/sendNotification");
const instructorModel = require("../models/instructorsModel");
const studentModel = require("../models/studentsModel");

const documentName = "notification";

// @desc create new notification
// @route POST /api/v1/notifications
// @access private
const createNotification = createDocument(Model, documentName);

// @desc send system notification to all instructors by admin
// @route POST /api/v1/notifications/send-system-notification
// @access private (admin only)
const sendSystemNotificationToInstructors = asyncHandler(async (req, res) => {
	const { title, body, data } = req.body;
	const notification = await Model.create({
		userId: req.user._id, // system notification, no specific user
		userType: "Instructor",
		title,
		body,
		data,
	});

	await sendNotification({
		io: req.io,
		receivers: await instructorModel.find().distinct("_id"),
		userType: "Instructor",
		type: "system_alert",
		title,
		body,
		data,
	});

	res
		.status(200)
		.json({ message: "System notification sent to all instructors" });
});

// @desc send system notification to all students by admin
// @route POST /api/v1/notifications/send-system-notification-students
// @access private (admin only)
const sendSystemNotificationToStudents = asyncHandler(async (req, res) => {
	const { title, body, data } = req.body;
	const notification = await Model.create({
		userId: req.user._id, // system notification, no specific user
		userType: "Student",
		title,
		body,
		data,
	});

	await sendNotification({
		io: req.io,
		receivers: await studentModel.find().distinct("_id"),
		userType: "Student",
		type: "system_alert",
		title,
		body,
		data,
	});

	res.status(200).json({ message: "System notification sent to all students" });
});

// @desc get all notifications
// @route GET /api/v1/notifications
// @access private
const getAllNotifications = getAllDocuments(Model, documentName);

// @desc get all notifications for a logged in user and filter by read/unread status
// @route GET /api/v1/notifications/me
// @access private
const getUserNotifications = asyncHandler(async (req, res) => {
	const userId = req.user._id;
	const { isRead } = req.query;
	let notifications;

	if (isRead === "true") {
		notifications = await Model.find({ userId, isRead: true }).sort({
			createdAt: -1,
		});
	} else if (isRead === "false") {
		notifications = await Model.find({ userId, isRead: false }).sort({
			createdAt: -1,
		});
	} else {
		notifications = await Model.find({ userId }).sort({
			createdAt: -1,
		});
	}

	res.status(200).json({
		count: notifications.length,
		notRead: notifications.filter((n) => !n.isRead).length,
		notifications,
	});
});

//@desc make all logged-in user notifications as read
//@route PATCH /api/v1/notifications/me/mark-all-read
//@access private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
	const userId = req.user._id;
	const result = await Model.updateMany(
		{ userId, isRead: false },
		{ isRead: true, readAt: Date.now() },
	);
	res.status(200).json({ message: "All notifications marked as read", result });
});

// @desc get single notification details
// @route GET /api/v1/notifications/:id
// @access private
const getNotification = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const notification = await Model.findOne({ _id: id, userId: req.user._id }); // only your notifications
	if (!notification) {
		return res.status(404).json({ message: "Notification not found" });
	}
	res.status(200).json({ notification });
});

// @desc mark notification as read
// @route PATCH /api/v1/notifications/:id
// @access private
const markNotificationAsRead = asyncHandler(async (req, res) => {
	const { id } = req.params;

	// make sure the notification belongs to created user
	const notification = await Model.findOneAndUpdate(
		{ _id: id, userId: req.user._id },
		{ isRead: true, readAt: Date.now() },
		{ new: true },
	);
	if (!notification) {
		return res.status(404).json({ message: "Notification not found" });
	}
	res
		.status(200)
		.json({ message: "Notification marked as read", notification });
});

// @desc delete notification
// @route DELETE /api/v1/notifications/:id
// @access private
const deleteNotification = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const notification = await Model.findByIdAndUpdate(
		id,
		{ isDeleted: true },
		{ new: true },
	);
	if (!notification) {
		return res.status(404).json({ message: "Notification not found" });
	}
	res.status(200).json({ message: "Notification deleted", notification });
});

module.exports = {
	createNotification,
	getAllNotifications,
	getUserNotifications,
	getNotification,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
	sendSystemNotificationToInstructors,
	sendSystemNotificationToStudents,
};
