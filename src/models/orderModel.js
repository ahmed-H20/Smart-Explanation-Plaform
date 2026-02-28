const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.ObjectId,
			ref: "Student",
			required: [true, "Student is required"],
		},
		instructor: {
			type: mongoose.Schema.ObjectId,
			ref: "Instructor",
			required: [true, "Instructor is required"],
		},
		offer: {
			type: mongoose.Schema.ObjectId,
			ref: "Offer",
			required: [true, "Offer is required"],
		},
		status: {
			type: String,
			enum: [
				"paid",
				"in_progress",
				"submitted",
				"completed",
				"cancelled",
				"disputed", // حالة النزاع
			],
			default: "in_progress",
		},
		paymentStatus: {
			type: String,
			enum: ["held", "released", "refunded"],
			default: "held",
		},
		studentPrice: {
			type: Number,
			required: [true, "studentPrice is required"],
		},
		instructorPrice: {
			type: Number,
			required: [true, "instructorPrice is required"],
		},
		studentCurrency: {
			type: String,
			required: [true, "student currency is required"],
		},
		instructorCurrency: {
			type: String,
			required: [true, "instructor currency is required"],
		},
		deadline: {
			type: Date,
			required: [true, "deadline is required"],
		},
		videos: {
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
			updatedAt: Date,
		},
		documents: [String],
		quizzes: [String],
		paidAt: Date,
		startedAt: Date,
		completedAt: Date,
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		strict: "throw",
	},
);

//Add full file url
const addFileURL = (doc) => {
	if (doc.documents) {
		doc.documents = doc.documents.map((file) => {
			// لو already starts with http
			if (file.startsWith("http")) return file;
			return `${process.env.BASE_URL}/students/files/${file}`;
		});
	}
	if (doc.quizzes) {
		doc.quizzes = doc.quizzes.map((file) => {
			// لو already starts with http
			if (file.startsWith("http")) return file;
			return `${process.env.BASE_URL}/students/files/${file}`;
		});
	}
};
orderSchema.post("init", addFileURL);
orderSchema.post("save", addFileURL);

module.exports = mongoose.model("Order", orderSchema);
