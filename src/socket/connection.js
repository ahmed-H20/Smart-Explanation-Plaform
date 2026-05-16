const jwt = require("jsonwebtoken");

const studentModel = require("../models/studentsModel");
const instructorModel = require("../models/instructorsModel");
const chatHandler = require("./chat");
const notificationHandler = require("./notification");

module.exports = (io) => {
	// 🔐 auth middleware
	io.use(async (socket, next) => {
		try {
			const token =
				socket.handshake.auth?.token || socket.handshake.query?.token;

			if (!token) throw new Error("No token");

			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

			const models = [studentModel, instructorModel];

			const results = await Promise.all(
				models.map((model) => model.findById(decoded.id)),
			);

			const currentUser = results.find(Boolean);

			if (!currentUser) throw new Error("User not found");

			socket.user = {
				id: currentUser._id,
				role: currentUser.role,
			};
			next();
		} catch (err) {
			next(new Error("Unauthorized"));
		}
	});

	// 🔌 connection
	io.on("connection", (socket) => {
		console.log("User connected:", socket.user.id);

		// 🟢 personal room
		socket.join(socket.user.id.toString());

		// 🟢 role room (notifications)
		if (socket.user.role === "student") socket.join("students");
		if (socket.user.role === "instructor") socket.join("instructors");

		// get socket rooms
		const rooms = Array.from(socket.rooms);
		console.log("User rooms:", rooms);

		// 🟢 register modules
		chatHandler(io, socket);
		notificationHandler(io, socket);

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.user.id);
		});
	});
};
