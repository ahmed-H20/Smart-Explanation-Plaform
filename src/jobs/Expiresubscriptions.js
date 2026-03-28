const cron = require("node-cron");
const Subscription = require("../models/subscriptionModel"); // adjust path

/**
 * Subscription Expiry Cron Job
 *
 * Runs every day at midnight (00:00).
 * Finds all subscriptions where:
 *   - status is still "active"
 *   - endDate has passed (endDate <= now)
 * and bulk-updates them to status = "expired".
 *
 * This keeps the database consistent so that subscription status
 * can be trusted without always needing the runtime endDate > now guard.
 *
 * Schedule: "0 0 * * *"  → at 00:00 every day
 * To run every hour instead: "0 * * * *"
 */
const expireSubscriptions = cron.schedule(
	"0 0 * * *",
	async () => {
		try {
			const now = new Date();

			const result = await Subscription.updateMany(
				{
					status: "active",
					endDate: { $lte: now },
				},
				{
					$set: { status: "expired" },
				},
			);

			if (result.modifiedCount > 0) {
				console.log(
					`[Cron] Subscription expiry — ${result.modifiedCount} subscription(s) marked as expired at ${now.toISOString()}`,
				);
			}
		} catch (err) {
			console.error("[Cron] Subscription expiry job failed:", err.message);
		}
	},
	{
		scheduled: false, // started explicitly in app.js / server.js
		timezone: "UTC",
	},
);

// Start the cron after DB connects
expireSubscriptions.start();
