const crypto = require("crypto");
const { getRedisClient } = require("../../config/redis");

const EMAIL_QUEUE = "emailQueue";

// function to send email
exports.addEmailJob = async (data) => {
	const redis = await getRedisClient();
	console.log(redis);

	// create job
	const job = {
		id: crypto.randomUUID(),
		type: "NEW_ASSIGNMENT_REQUEST",
		data,
		createdAt: Date.now(),
	};

	// push job to email queue
	await redis.rPush(EMAIL_QUEUE, JSON.stringify(job));
};
