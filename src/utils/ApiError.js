class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(5) ? "error" : "failed";
    this.isOptional = true;
  }
}

module.exports = ApiError;
