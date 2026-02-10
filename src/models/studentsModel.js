const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const studentSchema = mongoose.Schema(
	{
		fullName: {
			type: String,
			required: [true, "name is required"],
			trim: true,
		},
		university: {
			type: String,
			required: [true, "university is required"],
		},
		faculty: {
			type: String,
			required: [true, "faculty is required"],
		},
		specialization: {
			type: String,
		},
		year: {
			type: String,
			enum: ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"],
			message: "year must be between first and seventh",
			required: [true, "year is required"],
		},
		email: {
			type: String,
			required: [true, "email is required"],
			unique: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "password is required"],
			// select: false, // important for security, not return in res
		},
		phoneNumber: {
			type: String,
			required: [true, "phoneNumber is required"],
			unique: true,
		},
		active: {
			type: Boolean,
			default: true,
		},
		role: {
			type: String,
			default: "student",
			immutable: true,
		},
		passChangedAt: Date,
		passResetCode: String,
		passResetCodeExpire: Date,
		passResetCodeVerified: Boolean,
		country: {
			type: mongoose.Schema.ObjectId,
			ref: "Country",
			required: [true, "country is required"],
		},
	},
	{ timestamps: true },
);

// make complete image url
const addImageURL = (doc) => {
	if (doc.profileImage) {
		doc.profileImage = `${process.env.BASE_URL}/students/profileImages/${doc.profileImage}`;
	}
};
studentSchema.post("init", addImageURL);
studentSchema.post("save", addImageURL);

// Hash password
studentSchema.pre("save", async function () {
	// If password  not modified, skip
	if (!this.isModified("password")) return;

	// Hash the new password
	this.password = await bcrypt.hash(this.password, 12);

	// Update passChangedAt to current time (minus 1 sec for token timing issues)
	this.passChangedAt = Date.now() - 1000;
});

const studentModel = mongoose.model("Student", studentSchema);
module.exports = studentModel;
