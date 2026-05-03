const express = require("express");
const {
	createChat,
	getAllChats,
	getChatById,
	updateChat,
	deleteChat,
	unActiveChat,
	activeChat,
	getUserChats,
} = require("../controllers/chatting/chatController");
const instructorModel = require("../models/instructorsModel");
const { protect, allowedTo } = require("../controllers/authController");
const { getMessages } = require("../controllers/chatting/messageController");

const router = express.Router();

router.use(protect());
router.route("/user").get(getUserChats);

router.use(allowedTo("admin"));
router.route("/").post(createChat).get(getAllChats);
router.route("/:id").get(getChatById).patch(updateChat).delete(deleteChat);
router.get("/:chatId/getMessages", getMessages);

router.route("/:id/unActive").patch(unActiveChat);
router.route("/:id/active").patch(activeChat);

module.exports = router;
