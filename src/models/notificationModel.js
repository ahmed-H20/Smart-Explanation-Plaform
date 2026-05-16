const mongoose = require("mongoose");

const notificationsSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.ObjectId,
			refPath: "userType",
			required: [true, "user is required"],
		},
		userType: {
			type: String,
			enum: ["Student", "Instructor"],
			required: [true, "userType is required"],
		},
		type: {
			type: String,
			enum: [
				"videos_update",
				"new_message",
				"system_alert",
				"request_created",
				"offer_created",
				"offer_accepted",
				"offer_rejected",
				"offer_cancelled",
				"order_created",
				"order_completed",
				"order_cancelled",
				"solution_uploaded",
				"meeting_requested",
				"meeting_scheduled",
				"subscription_created",
			],
		},
		title: {
			type: String,
			required: [true, "Notification title is required"],
			trim: true,
		},
		body: {
			type: String,
			required: [true, "Notification body is required"],
		},
		data: {
			type: Object,
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		readAt: {
			type: Date,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// index
notificationsSchema.index({ userId: 1, createdAt: -1 });

// middleware to exclude deleted notifications from queries
notificationsSchema.pre(/^find/, function () {
	this.where({ isDeleted: false });
});

const notificationsModel = mongoose.model("notifications", notificationsSchema);
module.exports = notificationsModel;
