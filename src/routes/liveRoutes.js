const express = require("express");

const router = express.Router();

const {
	createSession,
	updateLiveSession,
	deleteLiveSession,
	getOne,
	getSessionsForLive,
	updateLive,
} = require("../controllers/liveController");
const { protect, allowedTo } = require("../controllers/authController");

router.use(protect(), allowedTo("instructor", "admin"));

router.post("/", createSession);

router.route("/:id").patch(updateLiveSession).delete(deleteLiveSession);

router.get("/:sessionId", getOne);

router.route("/live/:liveId").get(getSessionsForLive);
router.route("/live/:id").patch(updateLive);

module.exports = router;
