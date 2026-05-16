const asyncHandler = require("express-async-handler");

const {
	createDocument,
	getAllDocuments,
	getDocument,
	updateDocument,
	deleteDocument,
} = require("../handlerFactory");
const Model = require("../../models/chatModel");

const documentName = "chat";

// @desc create new Chat
// @route POST /api/v1/chats
// @access private
const createChat = createDocument(Model, documentName);

// @desc get all chats
// @route GET /api/v1/chats
// @access public
const getAllChats = getAllDocuments(Model, documentName);

// @desc get one Chat
// @route GET /api/v1/chats/:id
// @access public
const getChatById = getDocument(Model, documentName);

// @desc update one Chat
// @route PATCH /api/v1/chats/:id
// @access private
const updateChat = updateDocument(Model, documentName);

// @desc delete one Chat
// @route DELETE /api/v1/chats/:id
// @access private
const deleteChat = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const chat = await Model.findByIdAndUpdate(
		id,
		{
			isDeleted: true,
		},
		{ new: true },
	);

	res.status(200).json({
		message: `chat:${id} is deleted`,
	});
});

// @desc unActive one Chat
// @route PATCH /api/v1/chats/:id
// @access private
const unActiveChat = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const chat = await Model.findByIdAndUpdate(
		id,
		{
			isActive: false,
		},
		{ new: true },
	);

	res.status(200).json({
		message: `chat:${id} is deactivated`,
	});
});

// @desc active one Chat
// @route PATCH /api/v1/chats/:id
// @access private
const activeChat = asyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const chat = await Model.findByIdAndUpdate(
		id,
		{
			isActive: true,
		},
		{ new: true },
	);

	res.status(200).json({
		message: `chat:${id} is activated`,
	});
});

//@desc get user's chats
//@route GET /api/chats/my
//@access private
const getUserChats = asyncHandler(async (req, res) => {
	const user =
		req.user.role === "instructor"
			? "participants.instructor"
			: "participants.student";

	const chats = await Model.find({
		[user]: req.user._id,
	}).sort({ updatedAt: -1 });

	res.json({ chats });
});

module.exports = {
	createChat,
	getAllChats,
	getChatById,
	updateChat,
	deleteChat,
	unActiveChat,
	activeChat,
	getUserChats,
};
