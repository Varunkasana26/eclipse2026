const path = require("node:path");
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
  BACKEND_PUBLIC_URL:
    process.env.BACKEND_PUBLIC_URL || `http://127.0.0.1:${parseNumber(process.env.PORT, 5000)}`,
  HEARTBEAT_TIMEOUT_MS: parseNumber(process.env.HEARTBEAT_TIMEOUT_MS, 15000),
  ASSIGNMENT_SWEEP_MS: parseNumber(process.env.ASSIGNMENT_SWEEP_MS, 2000),
  MAX_LOGS_PER_JOB: parseNumber(process.env.MAX_LOGS_PER_JOB, 500),
  DEFAULT_WORKSPACE_ID: process.env.DEFAULT_WORKSPACE_ID || "demo-workspace",
  DEFAULT_MAX_ALLOC_PERCENT: parseNumber(process.env.DEFAULT_MAX_ALLOC_PERCENT, 70),
  WORKER_SECRET: process.env.WORKER_SECRET || "",
  ARTIFACT_STORAGE_DIR:
    process.env.ARTIFACT_STORAGE_DIR || path.resolve(__dirname, "..", "..", "storage"),
  MAX_ASSET_UPLOAD_BYTES: parseNumber(process.env.MAX_ASSET_UPLOAD_BYTES, 100 * 1024 * 1024),
  CORS_ORIGINS: rawCorsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
