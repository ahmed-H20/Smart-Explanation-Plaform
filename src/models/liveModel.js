const mongoose = require("mongoose");

const liveSchema = mongoose.Schema(
	{
		numberOfTotalSessions: Number,
		numberOfCreatedSessions: Number,
		numberOfHours: Number,
		timeOfNextSession: Date,
		members: [String],
	},
	{
		timestamps: true,
	},
);

const liveModel = mongoose.model("Live", liveSchema);
module.exports = liveModel;
