const notificationModel = require("../models/notificationModel");

module.exports = (io, socket) => {
	// create notification
	socket.on("create_Notification", async (data) => {
		try {
			const { title, message, link } = data;
			const notification = await notificationModel.create({
				title,
				body: message,
				data: link ? { link } : {},
				userId: socket.user.id,
				userType: socket.user.role === "student" ? "Student" : "Instructor",
			});

			io.to(socket.user.id).emit("notification", notification);
		} catch (err) {
			console.error("Error creating notification:", err);
		}
	});

	// 🔔 listen for notifications
	io.on("notification", async (data) => {
		try {
			const { title, message, link } = data;
			const notification = await notificationModel.create({
				title,
				body: message,
				data: link ? { link } : {},
				userId: socket.user.id,
				userType: socket.user.role === "student" ? "Student" : "Instructor",
			});
			io.to(socket.user.id).emit("notification", notification);
		} catch (err) {
			console.error("Error creating notification:", err);
		}
	});
};
