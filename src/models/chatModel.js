const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
	{
		participants: {
			instructor: {
				type: mongoose.Schema.ObjectId,
				ref: "Instructor",
			},
			student: {
				type: mongoose.Schema.ObjectId,
				ref: "Student",
			},
		},
		referenceId: {
			type: mongoose.Schema.ObjectId,
			refPath: "referenceType",
		},
		referenceType: {
			type: String,
			enum: ["Order", "Offer"],
		},
		type: {
			type: String,
			enum: ["order", "liveOffer", "trialOffer"],
		},
		lastMessage: {
			type: mongoose.Schema.ObjectId,
			ref: "Message",
			default: null,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

// index
chatSchema.index(
	{
		"participants.instructor": 1,
		"participants.student": 1,
		referenceId: 1,
		referenceType: 1,
	},
	{
		unique: true,
		partialFilterExpression: {
			referenceId: { $exists: true },
		},
	},
);

// not find deleted chats by default
chatSchema.pre(/^find/, function () {
	this.where({ isDeleted: false });
});

const chatModel = mongoose.model("Chat", chatSchema);
module.exports = chatModel;
