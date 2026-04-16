require("dotenv").config();

const { default: mongoose } = require("mongoose");
const cron = require("node-cron");
const expireSubscriptions = require("./Expiresubscriptions");
const updateRate = require("./getCurrancyRate");

// Start the cron after DB connects
mongoose.connect(process.env.DB_URL).then(() => {
	console.log("DB connected");

	updateRate.start();

	expireSubscriptions.start();
});
