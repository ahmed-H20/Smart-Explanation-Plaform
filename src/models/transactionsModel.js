const mongoose = require("mongoose");

const transactionsSchema = mongoose.Schema(
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
		amount: {
			type: Number,
			required: [true, "Transaction amount is required"],
		},
		reason: {
			type: String,
			enum: [
				"order_payment",
				"order_completed",
				"order_create",
				"order_refund",
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
			enum: ["Order", "Wallet"], // order for orders, wallet for debit and credit
			required: true,
		},
		balanceBefore: {
			type: Number,
			required: [true, "Balance Before Transaction is required"],
		},
		balanceAfter: {
			type: Number,
			required: [true, "Balance After Transaction is required"],
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

// populate user
transactionsSchema.pre(/^find/, async function () {
	this.populate({
		path: "wallet",
		populate: {
			path: "userId",
			select: "fullName email",
		},
	});
});

module.exports = mongoose.model("Transaction", transactionsSchema);
