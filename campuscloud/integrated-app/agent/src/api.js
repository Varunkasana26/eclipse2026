import fetch from "node-fetch";
import config from "./config.js";
import logger from "./utils/logger.js";
import contract from "../../shared/runtimeContract.cjs";

const {
  buildHeartbeatPayload,
  buildJobStatusPayload,
  buildWorkerRegistrationPayload
} = contract;

async function request(method, path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.backendUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(config.workerSecret ? { Authorization: `Bearer ${config.workerSecret}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(
        `Backend request failed with ${response.status} ${response.statusText}${text ? `: ${text}` : ""}`
      );
    }

    return data;
  } catch (error) {
    logger.error("Backend request error", {
      method,
      path,
      error: error.message
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function registerWorker(systemInfo) {
  return request(
    "POST",
    "/api/workers/register",
    buildWorkerRegistrationPayload({
      workerId: config.workerId || systemInfo.hostname,
      workerName: config.workerName,
      workerTags: config.workerTags,
      executorMode: config.executorMode,
      workspaceId: config.workspaceId,
      nodeLane: config.nodeLane,
      maxAllocPercent: config.maxAllocPercent,
      allowDocker: config.allowDocker,
      systemInfo,
      agentVersion: "1.1.0"
    })
  );
}

async function sendHeartbeat(status, currentJobId) {
  return request(
    "POST",
    "/api/workers/heartbeat",
    buildHeartbeatPayload({
      workerId: config.workerId || config.workerName,
      status,
      currentJobId
    })
  );
}

async function pollForJob() {
  const workerId = config.workerId || config.workerName;
  return request("GET", `/api/workers/${encodeURIComponent(workerId)}/next-job`);
}

async function updateJobStatus(jobId, status, extra = {}) {
  return request(
    "POST",
    `/api/jobs/${encodeURIComponent(jobId)}/status`,
    buildJobStatusPayload({
      workerId: config.workerId || config.workerName,
      status,
      extra
    })
  );
}

async function sendJobLogs(jobId, logs) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return null;
  }

  return request("POST", `/api/jobs/${encodeURIComponent(jobId)}/logs`, { logs });
}

async function sendJobResult(jobId, result) {
  return request("POST", `/api/jobs/${encodeURIComponent(jobId)}/result`, result);
}

export {
  registerWorker,
  sendHeartbeat,
  pollForJob,
  updateJobStatus,
  sendJobLogs,
  sendJobResult
};
