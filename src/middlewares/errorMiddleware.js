const ApiError = require("../utils/ApiError");

const sendErrorForDev = (res, err) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrorForProd = (res, err) => {
	res.status(err.statusCode).json({
		status: err.status,
		message: err.message,
	});
};

const GlobalError = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || "error";

	console.log("Mode is ", process.env.NODE_ENV);

	if (process.env.NODE_ENV === "development") {
		sendErrorForDev(res, err);
	} else {
		if (err.name === "TokenExpiredError")
			err = new ApiError("Expire token, please login again...", 401);
		if (err.name === "JsonWebTokenError")
			err = new ApiError("Invalid token, please login again...", 401);

		sendErrorForProd(res, err);
	}
};

module.exports = GlobalError;
