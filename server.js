require("dotenv").config({ path: ".env" });
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const dbConnecting = require("./src/config/database");
const GlobalError = require("./src/middlewares/errorMiddleware");
const ApiError = require("./src/utils/ApiError");
const InstructorRoutes = require("./src/routes/instructorsRoutes");
const StudentRoutes = require("./src/routes/studentsRoutes");
const AuthRoutes = require("./src/routes/authRoutes");
const CountryRoutes = require("./src/routes/countryRoutes");
const FieldsRoutes = require("./src/routes/fieldRoutes");
const MajorsRoutes = require("./src/routes/majorRoutes");
const WalletsRoutes = require("./src/routes/walletRoutes");
const TransactionRoutes = require("./src/routes/transactionRoutes");
const RequestRoutes = require("./src/routes/requestRoutes");
const OffersRoutes = require("./src/routes/offerRoutes");
const OrderRoutes = require("./src/routes/orderRoutes");
const AssignmentRoutes = require("./src/routes/assignmentRoutes");
const SubscriptionPlanRoutes = require("./src/routes/subscriptionplanRoutes");
const Subscription = require("./src/routes/subscriptionRoutes");
const HourlyPrices = require("./src/routes/CountryHourlyPricingRoutes");
const { connectRedis } = require("./src/config/redis");
const expireSubscriptions = require("./src/crons/Expiresubscriptions");
const responseFormatter = require("./src/middlewares/responseFormatter");

// Create app
const app = express();

// Connect db
dbConnecting();

// Connect redis
connectRedis();

// Middlewares
app.use(morgan("dev")); //logging
app.use(express.json());
app.use(express.static(path.join("upload"))); //to make url for statics files
app.use(responseFormatter);

// Mount Routes
app.use("/api/v1/instructors", InstructorRoutes);
app.use("/api/v1/students", StudentRoutes);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/countries", CountryRoutes);
app.use("/api/v1/fields", FieldsRoutes);
app.use("/api/v1/majors", MajorsRoutes);
app.use("/api/v1/wallets", WalletsRoutes);
app.use("/api/v1/transactions", TransactionRoutes);
app.use("/api/v1/requests", RequestRoutes);
app.use("/api/v1/offers", OffersRoutes);
app.use("/api/v1/orders", OrderRoutes);
app.use("/api/v1/assignments", AssignmentRoutes);
app.use("/api/v1/subscriptionPlan", SubscriptionPlanRoutes);
app.use("/api/v1/subscriptions", Subscription);
app.use("/api/v1/hourlyPrices", HourlyPrices);

// Not found route
app.use((req, res, next) => {
	const message = new Error(`cant find this : ${req.originalUrl}`);
	next(new ApiError(message, 400));
});

// Global Error Handling in Express
app.use(GlobalError);

// create server listener
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
	console.log(`server running on ${port} 🚀 `);
});

// Get your endpoint online in dev mode
// if (process.env.NODE_ENV === "development") {
// 	ngrok
// 		.connect({ addr: process.env.PORT, authtoken_from_env: true })
// 		.then((listener) =>
// 			console.log(`Ingress established at: ${listener.url()}`),
// 		);

// 	// createMuxPlaybackTokens("siuBcAWgenpHmhyCtb5GQZh8U65b8HhA00j27Kj5A5ns").then(
// 	// 	(result) => {
// 	// 		console.log(result);
// 	// 	},
// 	// );
// }

// Global Error Handling Outside Express
process.on("unhandledRejection", (err) => {
	console.log(`RejectionHandled Error: ${err.name} | ${err.message}`);
	server.close(() => {
		console.log("shutting down.....");
		process.exit(1);
	});
});
