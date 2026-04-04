import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");

loadEnvFile(envPath);

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
        continue;
      }

      process.env[key] = stripQuotes(value);
    }
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({
        ts: new Date().toISOString(),
        level: "warn",
        message: "Failed to load .env file",
        file_path: filePath,
        error: error.message
      })}\n`
    );
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

const config = {
  env: process.env.NODE_ENV || "development",
  backendUrl: (
    process.env.BACKEND_URL ||
    process.env.BACKEND_BASE_URL ||
    "http://127.0.0.1:5000"
  ).replace(/\/+$/, ""),
  workerSecret:
    process.env.WORKER_TOKEN ||
    process.env.WORKER_SECRET ||
    process.env.BACKEND_API_KEY ||
    "",
  workspaceId: process.env.WORKSPACE_ID || "demo-workspace",
  workerId: process.env.WORKER_ID || process.env.WORKER_NAME || os.hostname(),
  workerName: process.env.NODE_NAME || process.env.WORKER_NAME || "worker-node",
  nodeLane: process.env.NODE_LANE || "",
  maxAllocPercent: parseNumber(process.env.MAX_ALLOC_PERCENT, 70),
  allowDocker: parseBoolean(process.env.ALLOW_DOCKER, true),
  workerTags: parseList(process.env.WORKER_TAGS),
  heartbeatIntervalMs: parseNumber(process.env.HEARTBEAT_INTERVAL_MS, 5000),
  pollIntervalMs: parseNumber(process.env.POLL_INTERVAL_MS, 4000),
  requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 10000),
  executorMode: (process.env.EXECUTOR_MODE || "auto").toLowerCase(),
  mockJobDurationMs: parseNumber(process.env.MOCK_JOB_DURATION_MS, 6000),
  mockLogIntervalMs: parseNumber(process.env.MOCK_LOG_INTERVAL_MS, 1000)
};

export default config;
