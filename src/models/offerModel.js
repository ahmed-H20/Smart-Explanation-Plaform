const { request } = require("express");
const mongoose = require("mongoose");

const offerSchema = mongoose.Schema(
	{
		request: {
			type: mongoose.Schema.ObjectId,
			ref: "Request",
			required: [true, "request id is required"],
		},

		instructor: {
			type: mongoose.Schema.ObjectId,
			ref: "Instructor",
			required: [true, "instructor id is required"],
		},

		estimateTime: {
			type: Number,
			required: [true, "Estimated time is required"], // بالايام
		},

		demoVideo: {
			type: String,
			required: [true, "Demo video link is required"],
		},

		price: {
			type: Number,
			required: [true, "Price is required"],
		},

		status: {
			type: String,
			enum: ["pending", "accepted", "rejected", "completed"],
			default: "pending",
		},

		isDeleted: {
			type: Boolean,
			default: false,
		},

		studentCurrency: {
			type: String,
			required: [true, "Student currency is required"],
		},

		instructorCurrency: {
			type: String,
			required: [true, "Instructor currency is required"],
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

// const addImageURL = (doc) => {
// 	if (doc.demoFiles) {
// 		doc.demoFiles = doc.demoFiles.map((file) => {
// 			// لو already starts with http
// 			if (file.startsWith("http")) return file;
// 			return `${process.env.BASE_URL}/students/files/${file}`;
// 		});
// 	}
// };
// offerSchema.post("init", addImageURL);
// offerSchema.post("save", addImageURL);

module.exports = mongoose.model("Offer", offerSchema);
