const mongoose = require("mongoose");

const majorSchema = mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, "major name is required"],
			unique: true,
		},
		field: {
			type: mongoose.Schema.ObjectId,
			ref: "Field",
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

const majorModel = mongoose.model("major", majorSchema);
module.exports = majorModel;
