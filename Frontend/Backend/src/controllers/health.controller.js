const env = require("../config/env");
const { success } = require("../utils/response");

function getHealth(req, res) {
  return res.status(200).json(
    success("Server is healthy.", {
      status: "ok",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  );
}

module.exports = {
  getHealth,
};
