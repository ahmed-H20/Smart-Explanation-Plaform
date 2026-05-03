const jwt = require("jsonwebtoken");

const studentModel = require("../models/studentsModel");
const instructorModel = require("../models/instructorsModel");
const chatHandler = require("./chat");

module.exports = (io) => {
	// 🔐 auth middleware
	io.use(async (socket, next) => {
		console.log("Socket auth middleware triggered", socket.handshake);
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

		// 🟢 personal room (notifications)
		socket.join(socket.user.id);

		// get socket rooms
		const rooms = Array.from(socket.rooms);
		console.log("User rooms:", rooms);

		// 🟢 register modules
		chatHandler(io, socket);

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.user.id);
		});
	});
};
