const { google } = require("googleapis");

const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (options) => {
	console.log(process.env.GOOGLE_REFRESH_TOKEN);
	//2- Get access token automatic
	const oAuth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		"https://developers.google.com/oauthplayground",
	);
	oAuth2Client.setCredentials({
		refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
	});
	const accessToken = await oAuth2Client.getAccessToken();

	//1- Create mail
	const transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			type: "OAuth2",
			user: process.env.USER_NAME,
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			accessToken: accessToken.token,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});

	const emailOptions = {
		from: `Smart Explanation platform <${options.from}>`,
		to: options.to,
		subject: options.subject,
		text: options.message,
	};

	// Send mail
	const result = await transporter.sendMail(emailOptions);
	if (!result) {
		return Error(`Field to send email to ${options.email}`);
	}
	console.log("mail is sent 💌");
});

module.exports = sendEmail;
