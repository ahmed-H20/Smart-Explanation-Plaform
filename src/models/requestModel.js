const mongoose = require("mongoose");

const requestSchema = mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.ObjectId,
			ref: "Student",
			required: [true, "Student id is required"],
		},
		major: {
			type: mongoose.Schema.ObjectId,
			ref: "Major",
			required: [true, "Major is required"],
		},
		title: String,
		description: {
			type: String,
			required: [true, "Request description is required"],
		},
		budget: {
			type: Number,
		},
		status: {
			type: String,
			enum: ["open", "in-progress", "completed", "cancelled"],
			default: "open",
		},
		// open	مستني عروض
		// in-progress	فيه offer اتقبل
		// completed	الطلب خلص
		// cancelled	الطالب لغاه
		demoFiles: [
			{
				type: String,
				required: [true, "demo file is required"],
			},
		],
		deadline: {
			type: Date,
			required: [true, "deadline is required for instructor"],
		},
		numberOfOffers: {
			type: Number,
			default: 0,
		},
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

const addImageURL = (doc) => {
	if (doc.demoFiles) {
		doc.demoFiles = doc.demoFiles.map((file) => {
			// لو already starts with http
			if (file.startsWith("http")) return file;
			return `${process.env.BASE_URL}/students/files/${file}`;
		});
	}
};
requestSchema.post("init", addImageURL);
requestSchema.post("save", addImageURL);

module.exports = mongoose.model("request", requestSchema);
