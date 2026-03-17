const { getRedisClient, connectRedis } = require("../../config/redis");
require("dotenv").config({ path: ".env" });
const sendEmail = require("../../utils/sendEmail");

const EMAIL_QUEUE = "emailQueue";

const processJob = async () => {
	await connectRedis();

	const redis = await getRedisClient();

	console.log(EMAIL_QUEUE);

	const jobData = await redis.blPop(EMAIL_QUEUE, 0);

	console.log("jobData", jobData);

	const job = JSON.parse(jobData.element);

	console.log(EMAIL_QUEUE);

	try {
		await sendEmail({
			to: job.data.instructor.email,
			subject: "New Assignment Request",
			text: `Budget: ${job.data.request.budget}`,
		});
		console.log("✅ Email sent", job.id);
	} catch (err) {
		console.error("❌ Email failed", job.id, err);

		// send to queue
		await redis.rPush(EMAIL_QUEUE, JSON.stringify(job));
	}

	await processJob(); // call recursively
};
processJob();

module.exports = processJob;
