const { google } = require("googleapis");

const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (options) => {
	// Create OAuth2 client
	const oAuth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"https://developers.google.com/oauthplayground",
	);

	oAuth2Client.setCredentials({
		refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
	});

	// Get fresh access token
	const accessToken = await oAuth2Client.getAccessToken();

	// Create transporter
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: process.env.USER_NAME,
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
			accessToken: accessToken.token,
		},
	});

	const emailOptions = {
		from: `JAR Academy <jar.academy1@gmail.com>`,
		to: options.to,
		subject: options.subject,
		html: options.html,
	};

	// Send mail
	const result = await transporter.sendMail(emailOptions);
	if (!result) {
		return Error(`Field to send email to ${options.email}`);
	}
	console.log("mail is sent 💌");
});

module.exports = sendEmail;
