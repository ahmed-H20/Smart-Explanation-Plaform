const { request } = require("express");
const mongoose = require("mongoose");

const Request = require("./requestModel");
const Instructor = require("./instructorsModel");

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
		},

		demoVideo: {
			assetId: {
				type: String,
			},

			playbackId: {
				type: String,
			},

			status: {
				type: String,
				enum: ["waiting", "processing", "ready", "failed"],
				default: "waiting",
			},

			duration: Number,

			uploadUrl: String,
		},

		studentPrice: {
			type: Number,
			// required: [true, "studentPrice is required"],
		},

		instructorPrice: Number,

		status: {
			type: String,
			enum: ["is-processing", "pending", "accepted", "rejected", "cancelled"],
			default: "is-processing",
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

		allFiles: [String],
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

//Not find deleted data
offerSchema.pre(/^find/, async function () {
	this.find({ isDeleted: { $ne: true } });
});

//Add full file url
const addFileURL = (doc) => {
	if (doc.allFiles) {
		doc.allFiles = doc.allFiles.map((file) => {
			// لو already starts with http
			if (file.startsWith("http")) return file;
			return `${process.env.BASE_URL}/students/files/${file}`;
		});
	}
};
offerSchema.post("init", addFileURL);
offerSchema.post("save", addFileURL);

//Add currency
offerSchema.pre("validate", async function () {
	// 1- get currencyCode from student
	const requestDoc = await Request.findById(this.request).populate({
		path: "student",
		populate: {
			path: "country",
			select: "currencyCode",
		},
	});

	// 2- get currencyCode from instructor
	const instructorDoc = await Instructor.findById(this.instructor).populate({
		path: "country",
		select: "currencyCode",
	});

	// 3- add studentCurrency & instructorCurrency
	this.studentCurrency = requestDoc.student.country.currencyCode;
	this.instructorCurrency = instructorDoc.country.currencyCode;
});

module.exports = mongoose.model("Offer", offerSchema);
