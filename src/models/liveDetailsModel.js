const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
	{
		liveId: {
			type: mongoose.Schema.ObjectId,
			ref: "Live",
		},
		startTime: Date,
		endTime: Date,
		meetingLink: String,
	},
	{
		timestamps: true,
	},
);

const liveSessionsDetailsModel = mongoose.model("Session", sessionSchema);
module.exports = liveSessionsDetailsModel;
