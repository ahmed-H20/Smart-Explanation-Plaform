/* eslint-disable prefer-arrow-callback */
const mongoose = require("mongoose");

const sendEmail = require("../utils/sendEmail");
const Wallet = require("./walletModel");

const transactionsSchema = new mongoose.Schema(
	{
		wallet: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Wallet",
			required: true,
		},
		type: {
			type: String,
			enum: ["credit", "debit"],
			required: [true, "Transaction type is required"],
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed"],
			required: [true, "Transaction status is required"],
		},
		amountUSD: {
			type: Number,
			required: [true, "Transaction amount is required"],
			min: [0.01, "Amount must be greater than 0"],
		},
		platform: {
			type: String,
			enum: ["instapay", "vodafoneCash"],
		},
		image: {
			type: String,
		},
		// Proof of payment sent to the instructor after a withdrawal is approved
		receipt: {
			type: String,
			default: null,
		},
		reason: {
			type: String,
			enum: [
				"order_payment",
				"order_completed",
				"order_cancelled",
				"order_create",
				"order_refund",
				"subscription_payment",
				"manual_charge_by_admin",
				"platform_profit",
				"withdraw",
				"deposit",
			],
			required: [true, "Transaction reason is required"],
		},
		referenceId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		referenceModel: {
			type: String,
			enum: ["Order", "Wallet", "Subscription"],
			required: true,
		},
		balanceBeforeUSD: {
			type: Number,
			required: [true, "Balance before transaction is required"],
		},
		balanceAfterUSD: {
			type: Number,
			required: [true, "Balance after transaction is required"],
		},
		description: {
			type: String,
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────

// Most common query: "my transactions, newest first"
transactionsSchema.index({ wallet: 1, createdAt: -1 });

// Admin filtering by status + reason
transactionsSchema.index({ status: 1, reason: 1 });

// ─────────────────────────────────────────────
// Query middleware — populate wallet → user
// ─────────────────────────────────────────────

transactionsSchema.pre(/^find/, function () {
	this.populate({
		path: "wallet",
		select: "userId userType",
		populate: {
			path: "userId",
			select: "fullName email",
		},
	});
});

// ─────────────────────────────────────────────
// Post-save hook — email notifications
// ─────────────────────────────────────────────

transactionsSchema.post("save", async function (doc) {
	try {
		const wallet = await Wallet.findById(doc.wallet).populate({
			path: "userId",
			populate: { path: "country" },
		});

		if (!wallet?.userId) return;

		const user = wallet.userId;
		const currencyCode =
			wallet.currencyCode || (user.country?.currencyCode ?? "");

		// ── Email to user ──────────────────────────────
		await sendEmail({
			to: user.email,
			subject: "New Transaction Notification",
			html: `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:8px;">
    <h2 style="color:#2c3e50;">Transaction Notification</h2>
    <p>Hello <strong>${user.fullName}</strong>,</p>
    <p>A new transaction has been processed on your wallet.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:15px;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Type</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${doc.type}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Status</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${doc.status}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Amount</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${doc.amountUSD} USD</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Balance Before</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${doc.balanceBeforeUSD} USD</td></tr>
      <tr><td style="padding:8px;"><strong>Balance After</strong></td><td style="padding:8px;">${doc.balanceAfterUSD} USD</td></tr>
    </table>
    <p style="margin-top:20px;">If you did not initiate this transaction, please contact support immediately.</p>
    <p style="margin-top:30px;font-size:12px;color:#888;">© ${new Date().getFullYear()} Your Platform. All rights reserved.</p>
  </div>
</div>`,
		});

		// ── Email to admin ─────────────────────────────
		await sendEmail({
			to: process.env.ADMIN_EMAIL,
			subject: "New Transaction Created",
			html: `
<div style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:8px;">
    <h2 style="color:#e74c3c;">New Transaction Alert</h2>
    <p><strong>User:</strong> ${user.fullName}</p>
    <p><strong>Transaction ID:</strong> ${doc._id}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>phoneNumber:</strong> ${user.phoneNumber}</p>
    <p><strong>Platform:</strong> ${doc.platform}</p>
    <p><strong>Type:</strong> ${doc.type}</p>
    <p><strong>Status:</strong> ${doc.status}</p>
    <p><strong>Amount:</strong> ${doc.amountUSD} USD</p>
    <p><strong>Reason:</strong> ${doc.reason}</p>
    <p><strong>Date:</strong> ${doc.createdAt.toISOString()}</p>
  </div>
</div>`,
		});
	} catch (err) {
		// Non-fatal — log but never crash the request
		console.error("Transaction email notification error:", err);
	}
});

module.exports = mongoose.model("Transaction", transactionsSchema);
