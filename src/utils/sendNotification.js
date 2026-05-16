const notificationModel = require("../models/notificationModel");

exports.sendNotification = async ({
	io,
	receivers,
	userType,
	type,
	title,
	body,
	data = {},
}) => {
	const notifications = await Promise.all(
		receivers.map(async (receiver) => {
			if (!receiver) return null;

			const notification = await notificationModel.create({
				userId: receiver,
				userType,
				type,
				title,
				body,
				data,
			});

			io.to(receiver.toString()).emit("newNotification", notification);

			return notification;
		}),
	);

	return notifications;
};
