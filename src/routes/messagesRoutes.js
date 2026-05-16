// Messages Routes
const express = require("express");
const {
	sendMessage,
	getMessages,
	markMessagesAsSeen,
} = require("../controllers/chatting/messageController");
const { protect } = require("../controllers/authController");

const router = express.Router();
router.use(protect());

router.post("/:chatId/send", sendMessage);
router.get("/:chatId/getMessages", getMessages);
router.patch("/:messageId/seen", markMessagesAsSeen);

module.exports = router;
