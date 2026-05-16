const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
	{
		chatId: {
			type: mongoose.Schema.ObjectId,
			ref: "Chat",
		},
		sender: {
			id: {
				type: mongoose.Schema.ObjectId,
				pathRef: "type",
			},
			type: {
				type: String,
				enum: ["Student", "Instructor"],
			},
		},
		content: {
			type: String,
			trim: true,
		},
		isSeen: {
			type: Boolean,
			default: false,
		},
		seenAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	},
);

// index
messageSchema.index({ chatId: 1, createdAt: -1 });

const messageModel = mongoose.model("Message", messageSchema);
module.exports = messageModel;
