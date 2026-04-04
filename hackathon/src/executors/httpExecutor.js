import fetch from "node-fetch";
import config from "../config.js";

const POLL_INTERVAL_MS = 1500;
const EXECUTION_TIMEOUT_MS = 5 * 60 * 1000;

async function request(method, path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.executorUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(`Executor request failed: ${response.status} ${response.statusText}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function cancelJob(jobId) {
  try {
    await request("POST", `/cancel/${encodeURIComponent(jobId)}`);
  } catch {
    return null;
  }

  return null;
}

async function run(job, hooks = {}) {
  const resourceRequirements = job.resource_requirements || {};
  const sentLogKeys = new Set();
  const startedAt = Date.now();

  await request("POST", "/execute", {
    job_id: job.job_id,
    image: job.image,
    command: Array.isArray(job.command) ? job.command : [],
    env: job.env && typeof job.env === "object" ? job.env : {},
    timeout_ms: job.timeout_ms,
    resource_requirements: {
      gpu_required: Boolean(resourceRequirements.gpu_required),
      gpu_count: resourceRequirements.gpu_count ?? 0,
      min_gpu_memory_mb: resourceRequirements.min_gpu_memory_mb ?? 0
    }
  });

  while (true) {
    if (Date.now() - startedAt > EXECUTION_TIMEOUT_MS) {
      await cancelJob(job.job_id);
      const result = {
        exit_code: -1,
        output_files: [],
        duration_ms: Date.now() - startedAt,
        error: "Execution timed out after 5 minutes"
      };

      if (typeof hooks.onFail === "function") {
        await hooks.onFail(result);
      }

      return {
        status: "failed",
        logs: [],
        result
      };
    }

    const response = await request("GET", `/status/${encodeURIComponent(job.job_id)}`);
    const logs = Array.isArray(response?.logs) ? response.logs : [];

    for (const entry of logs) {
      const key = `${entry.ts}|${entry.stream}|${entry.text}`;
      if (sentLogKeys.has(key)) {
        continue;
      }

      sentLogKeys.add(key);
      if (typeof hooks.onLog === "function") {
        await hooks.onLog(entry);
      }
    }

    if (response?.status === "completed" || response?.status === "failed") {
      const result = {
        ...(response.result || {}),
        duration_ms: response.result?.duration_ms ?? response.elapsed_ms ?? Date.now() - startedAt
      };

      if (response.status === "completed") {
        if (typeof hooks.onComplete === "function") {
          await hooks.onComplete(result);
        }
      } else if (typeof hooks.onFail === "function") {
        await hooks.onFail(result);
      }

      return {
        status: response.status,
        logs,
        result
      };
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

export { run };
