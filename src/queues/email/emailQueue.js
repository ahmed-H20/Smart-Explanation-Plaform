const crypto = require("crypto");
const { getRedisClient } = require("../../config/redis");

const EMAIL_QUEUE = "emailQueue";

// function to send email
exports.addEmailJob = async (data, job) => {
	const redis = await getRedisClient();
	let currentJob;

	switch (job) {
		case "newAssignment":
			// create assignment job
			currentJob = {
				id: crypto.randomUUID(),
				type: "NEW_ASSIGNMENT_REQUEST",
				data,
				createdAt: Date.now(),
			};
			break;

		case "newDirectRequest":
			// create direct request
			currentJob = {
				id: crypto.randomUUID(),
				type: "NEW_DIRECT_REQUEST",
				data,
				createdAt: Date.now(),
			};
			break;

		case "directRequestAccepted":
			// create direct request
			currentJob = {
				id: crypto.randomUUID(),
				type: "ACCEPT_DIRECT_REQUEST",
				data,
				createdAt: Date.now(),
			};
			break;

		default:
	}

	// push job to email queue
	await redis.rPush(EMAIL_QUEUE, JSON.stringify(currentJob));
};
