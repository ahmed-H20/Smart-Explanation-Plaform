const Message = require("../models/messagesModel");
const Chat = require("../models/chatModel");

module.exports = (io, socket) => {
	// 🟢 join chat
	socket.on("join_chat", (chatId) => {
		socket.join(chatId);
		console.log(`User joined chat: ${chatId}`);
	});

	// 🟢 leave chat
	socket.on("leave_chat", (chatId) => {
		socket.leave(chatId);
	});

	// 💬 send message
	socket.on("send_message", async (data) => {
		try {
			const { chatId, content } = data;

			// ⚠️ validate (important)
			if (!chatId || !content) return;

			// save message
			const message = await Message.create({
				chatId,
				sender: {
					id: socket.user.id,
					type: socket.user.role === "student" ? "Student" : "Instructor",
				},
				content,
			});

			console.log("Message saved:", message);

			// update last message
			await Chat.findByIdAndUpdate(chatId, {
				lastMessageId: message._id,
			});

			// 🔥 emit to room
			socket.to(chatId).emit("new_message", message);

			// 🔔 notification (optional)
			// io.to(otherUserId).emit("notification", {...});
		} catch (err) {
			console.error("send_message error:", err);
		}
	});

	// 👀 seen
	socket.on("seen_message", async ({ messageId }) => {
		await Message.findByIdAndUpdate(messageId, {
			isSeen: true,
			seenAt: new Date(),
		});

		io.emit("message_seen", { messageId });
	});

	// ⌨️ typing
	socket.on("typing", ({ chatId }) => {
		socket.to(chatId).emit("typing", {
			userId: socket.user.id,
		});
	});

	socket.on("stop_typing", ({ chatId }) => {
		socket.to(chatId).emit("stop_typing", {
			userId: socket.user.id,
		});
	});
};
