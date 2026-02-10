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

// Create app
const app = express();

// Connect db
dbConnecting();

// Middlewares
app.use(morgan("dev")); //logging
app.use(express.json());
app.use(express.static(path.join("upload"))); //to make url for statics files

// Mount Routes
app.use("/api/v1/instructors", InstructorRoutes);
app.use("/api/v1/students", StudentRoutes);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/countries", CountryRoutes);
app.use("/api/v1/fields", FieldsRoutes);

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

// Global Error Handling Outside Express
process.on("unhandledRejection", (err) => {
	console.log(`RejectionHandled Error: ${err.name} | ${err.message}`);
	server.close(() => {
		console.log("shutting down.....");
		process.exit(1);
	});
});
