const mongoose = require("mongoose");

const fieldSchema = mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, "field name is required"],
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

const fieldModel = mongoose.model("Field", fieldSchema);
module.exports = fieldModel;
