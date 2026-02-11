const mongoose = require("mongoose");

const fieldSchema = mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, "field name is required"],
			unique: true,
		},
		description: {
			type: String,
			minlength: [20, "Too short Field description"],
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

const fieldModel = mongoose.model("Field", fieldSchema);
module.exports = fieldModel;
