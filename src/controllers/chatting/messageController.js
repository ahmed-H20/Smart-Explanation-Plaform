const asyncHandler = require("express-async-handler");
const Chat = require("../../models/chatModel");
const Message = require("../../models/messagesModel");

//@desc send message in a chat
//@route POST /api/messages/:chatId/send
//@access private
const sendMessage = asyncHandler(async (req, res) => {
	const { chatId } = req.params;
	const { content, messageType } = req.body;

	const message = await Message.create({
		chatId,
		senderId: req.user._id,
		senderType: req.user.role, // Student / Instructor
		content,
		messageType,
	});

	// update last message
	await Chat.findByIdAndUpdate(chatId, {
		lastMessageId: message._id,
	});

	// 🔥 real-time
	req.io.to(chatId).emit("new_message", message); // TODO: make socket in separate file

	res.status(201).json({ message });
});

//@desc get messages of a chat
//@route GET /api/messages/:chatId
//@access private
const getMessages = asyncHandler(async (req, res) => {
	const { chatId } = req.params;
	const { limit = 20, cursor } = req.query;

	const query = { chatId };

	if (cursor) {
		query._id = { $lt: cursor };
	}

	const messages = await Message.find(query)
		.sort({ _id: -1 })
		.limit(Number(limit));

	// add pagination info
	const nextCursor =
		messages.length > 0 ? messages[messages.length - 1]._id : null;
	res.json({ messages, nextCursor });
});

//@desc mark messages as seen
//@route PATCH /api/messages/:messageId/seen
//@access private
const markMessagesAsSeen = asyncHandler(async (req, res) => {
	const { messageId } = req.params;

	const message = await Message.findByIdAndUpdate(
		messageId,
		{ seen: true },
		{ new: true },
	);

	res.status(200).json({ message });
});

module.exports = {
	sendMessage,
	getMessages,
	markMessagesAsSeen,
};
