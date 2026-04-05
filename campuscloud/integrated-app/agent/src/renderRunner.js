import fetch from "node-fetch";
import config from "./config.js";
import logger from "./utils/logger.js";

function emitLine(text, stream, onLog) {
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    onLog?.({
      stream,
      text: line,
      ts: new Date().toISOString(),
    });
  }
}

function normalizeCommand(command) {
  if (!Array.isArray(command)) {
    return [];
  }

  return command.map((part) => String(part)).filter(Boolean);
}

function buildFailureResult(job, startedAt, error, infrastructureFailure = true, failureReason = "execution_error") {
  return {
    status: "failed",
    logs: [],
    result: {
      exit_code: 1,
      output_files: [],
      artifacts: [],
      duration_ms: Date.now() - startedAt,
      error: error.message,
      output: "",
      runner: "remote-render",
      gpu_server_url: config.gpuServerUrl,
      infrastructure_failure: infrastructureFailure,
      failure_reason: failureReason,
    },
  };
}

function buildRequestPayload(job) {
  const command = normalizeCommand(job.command);
  if (command.length === 0) {
    throw new Error("Render jobs require a command");
  }

  return {
    job_id: job.job_id,
    job_type: "render",
    image: job.image || null,
    command,
    env: job.env || {},
    resource_requirements: job.resource_requirements || {},
    input_artifacts: Array.isArray(job.metadata?.input_artifacts) ? job.metadata.input_artifacts : [],
    output_artifacts: job.metadata?.output_artifacts || null,
    render: job.metadata?.render || null,
    timeout_ms: Number(job.timeout_ms) || 300000,
  };
}

async function runRenderJob(job, hooks = {}) {
  const startedAt = Date.now();
  const endpoint = `${config.gpuServerUrl}/execute`;
  const controller = new AbortController();
  const timeoutMs = Number(job.timeout_ms) || config.requestTimeoutMs;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let payload;

  try {
    payload = buildRequestPayload(job);

    logger.info("Sending render execution request", {
      job_id: job.job_id,
      endpoint,
      timeout_ms: timeoutMs,
      command: payload.command,
      image: payload.image,
      input_artifact_count: payload.input_artifacts.length,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let responsePayload = {};
    if (rawBody) {
      try {
        responsePayload = JSON.parse(rawBody);
      } catch (error) {
        throw new Error(`Render server returned invalid JSON: ${error.message}`);
      }
    }

    if (!response.ok) {
      const detail =
        responsePayload.error || rawBody || `${response.status} ${response.statusText}`;
      throw new Error(`Render server request failed: ${detail}`);
    }

    const durationMs = Date.now() - startedAt;
    const output = typeof responsePayload.output === "string" ? responsePayload.output : "";
    const errorText =
      typeof responsePayload.error === "string" && responsePayload.error.trim()
        ? responsePayload.error
        : null;
    const artifacts = Array.isArray(responsePayload.artifacts) ? responsePayload.artifacts : [];

    logger.info("Render execution response received", {
      job_id: job.job_id,
      duration_ms: durationMs,
      artifact_count: artifacts.length,
      has_error: Boolean(errorText),
    });

    emitLine(output, "stdout", hooks.onLog);
    emitLine(errorText, "stderr", hooks.onLog);

    const result = {
      exit_code: errorText ? 1 : 0,
      output_files: artifacts,
      artifacts,
      duration_ms: Number(responsePayload.stats?.duration_ms) || durationMs,
      output,
      error: errorText,
      runner: "remote-render",
      gpu_server_url: config.gpuServerUrl,
      infrastructure_failure: false,
      failure_reason: errorText ? "execution_error" : null,
    };

    if (errorText) {
      await hooks.onFail?.(result);
      return {
        status: "failed",
        logs: [],
        result,
      };
    }

    await hooks.onComplete?.(result);
    return {
      status: "completed",
      logs: [],
      result,
    };
  } catch (error) {
    const failureReason =
      error.name === "AbortError"
        ? "timeout"
        : payload
          ? "offline"
          : "validation_error";
    const message =
      error.name === "AbortError"
        ? `timeout: Render server request timed out after ${timeoutMs}ms`
        : payload
          ? `offline: ${error.message}`
          : `validation_error: ${error.message}`;
    const failure = buildFailureResult(
      job,
      startedAt,
      new Error(message),
      Boolean(payload),
      failureReason
    );

    logger.warn("Render execution request failed", {
      job_id: job.job_id,
      endpoint,
      timeout_ms: timeoutMs,
      error: message,
    });

    await hooks.onFail?.(failure.result);
    return failure;
  } finally {
    clearTimeout(timeout);
  }
}

export { runRenderJob };
