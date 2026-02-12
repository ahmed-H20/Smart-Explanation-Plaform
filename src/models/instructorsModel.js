const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Country = require("./countryModel");
const Wallet = require("./walletModel");

const instructorsSchema = mongoose.Schema(
	{
		fullName: {
			type: String,
			required: [true, "name is required"],
			trim: true,
		},
		age: {
			type: Number,
			required: [true, "age is required"],
			min: 16,
		},
		status: {
			type: String,
			enum: ["student", "graduate", "employed"],
			required: [true, "Instructor status is required"],
		},
		currentJob: {
			type: String,
			default: null,
		},
		certifications: [
			{
				type: String,
			},
		],
		university: {
			type: String,
			required: [true, "university is required"],
		},
		faculty: {
			type: String,
			required: [true, "faculty is required"],
		},
		major: {
			type: mongoose.Schema.ObjectId,
			ref: "Major",
			required: [true, "major is required"],
		},
		email: {
			type: String,
			required: [true, "email is required"],
			unique: true,
			trim: true,
		},
		profileImage: String,
		password: {
			type: String,
			required: [true, "password is required"],
			// select: false, // important for security, not return in res
		},
		active: {
			type: Boolean,
			default: true,
		},
		phoneNumber: {
			type: String,
			required: [true, "phoneNumber is required"],
			unique: true,
		},
		role: {
			type: String,
			enum: ["instructor", "admin"],
			default: "instructor",
		},
		wallet: {
			type: mongoose.Schema.ObjectId,
			ref: "Wallet",
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
	{
		timestamps: true,
	},
);

// make complete image url
const addImageURL = (doc) => {
	if (doc.profileImage) {
		doc.profileImage = `${process.env.BASE_URL}/instructors/profileImages/${doc.profileImage}`;
	}
};
instructorsSchema.post("init", addImageURL);
instructorsSchema.post("save", addImageURL);

// Hash password
instructorsSchema.pre("save", async function () {
	// If password  not modified, skip
	if (!this.isModified("password")) return;

	// Hash the new password
	this.password = await bcrypt.hash(this.password, 12);

	// Update passChangedAt to current time (minus 1 sec for token timing issues)
	this.passChangedAt = Date.now() - 1000;
});

// Create User Wallet
async function createWallet() {
	if (!this.isNew) return;

	// Get Country
	const country = await Country.findById(this.country);
	if (!country) {
		return new Error("الدولة غير موجودة");
	}

	// Create Wallet
	const wallet = await Wallet.create({
		userId: this._id,
		userType: "instructor",
		currencyCode: country.currencyCode,
	});

	this.wallet = wallet._id;
}
instructorsSchema.pre("save", createWallet);

const instructorModel = mongoose.model("Instructor", instructorsSchema);
module.exports = instructorModel;
