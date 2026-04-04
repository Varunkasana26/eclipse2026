const dotenv = require("dotenv");

dotenv.config();

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const rawCorsOrigins = process.env.CORS_ORIGINS || clientUrl;

module.exports = {
  PORT: parseNumber(process.env.PORT, 5000),
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: clientUrl,
  HEARTBEAT_TIMEOUT_MS: parseNumber(process.env.HEARTBEAT_TIMEOUT_MS, 15000),
  ASSIGNMENT_SWEEP_MS: parseNumber(process.env.ASSIGNMENT_SWEEP_MS, 2000),
  MAX_LOGS_PER_JOB: parseNumber(process.env.MAX_LOGS_PER_JOB, 500),
  CORS_ORIGINS: rawCorsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
