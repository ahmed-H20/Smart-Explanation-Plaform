const { getRedisClient, connectRedis } = require("../../config/redis");
const {
	newAssignmentRequestTemplate,
	newDirectRequestTemplate,
} = require("../../utils/emailTemplates");
require("dotenv").config({ path: ".env" });
const sendEmail = require("../../utils/sendEmail");

const EMAIL_QUEUE = "emailQueue";

const processJob = async () => {
	await connectRedis();

	const redis = await getRedisClient();

	const jobData = await redis.blPop(EMAIL_QUEUE, 0);

	console.log("jobData", jobData);

	const job = JSON.parse(jobData.element);

	// Create NEW ASSIGNMENT REQUEST MAIL
	if (job.type === "NEW_ASSIGNMENT_REQUEST") {
		try {
			await sendEmail({
				to: job.data.instructor.email,
				subject: "طلب واجب جديد",
				html: newAssignmentRequestTemplate(
					job.data.request,
					job.data.instructor.fullName,
				),
			});
			console.log("✅ Email sent", job.id);
		} catch (err) {
			console.error("❌ Email failed", job.id, err);

			// send to queue
			await redis.rPush(EMAIL_QUEUE, JSON.stringify(job));
		}
	}

	// CREATE NEW DIRECT REQUEST MAIL
	if (job.type === "NEW_DIRECT_REQUEST") {
		try {
			await sendEmail({
				to: job.data.instructor.email,
				subject: "طلب مباشر جديد",
				html: newDirectRequestTemplate(
					job.data.directRequest,
					job.data.instructor.fullName,
				),
			});
			console.log("✅ Email sent", job.id);
		} catch (err) {
			console.error("❌ Email failed", job.id, err);

			// send to queue
			await redis.rPush(EMAIL_QUEUE, JSON.stringify(job));
		}
	}

	// ACCEPT DIRECT REQUEST MAIL
	if (job.type === "ACCEPT_DIRECT_REQUEST") {
		try {
			await sendEmail({
				to: job.data.instructor.email,
				subject: "تم الموافقة على طلبك المباشر",
				html: newDirectRequestTemplate(
					job.data.directRequest,
					job.data.instructor.fullName,
				),
			});
			console.log("✅ Email sent", job.id);
		} catch (err) {
			console.error("❌ Email failed", job.id, err);

			// send to queue
			await redis.rPush(EMAIL_QUEUE, JSON.stringify(job));
		}
	}

	await processJob(); // call recursively
};
processJob();

module.exports = processJob;
