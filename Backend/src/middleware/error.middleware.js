const { error } = require("../utils/response");

function notFoundHandler(req, res) {
  return res.status(404).json(error("Route not found."));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error.";

  return res.status(statusCode).json(
    error(message, process.env.NODE_ENV === "development" ? err.details : undefined)
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
