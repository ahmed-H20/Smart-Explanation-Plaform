const mongoose = require("mongoose");

const walletSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.ObjectId,
			refPath: "userType",
			required: [true, "user is required"],
		},
		userType: {
			type: String,
			enum: ["Student", "Instructor"],
			required: [true, "userType is required"],
		},
		balance: {
			type: Number,
			default: 0,
		},
		currencyCode: {
			// Get from countryId of user
			type: String,
			trim: true,
			required: [true, "Country currency code is required"],
			uppercase: true,
		},
		freezedBalance: {
			type: Number,
			default: 0,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

module.exports = mongoose.model("Wallet", walletSchema);
