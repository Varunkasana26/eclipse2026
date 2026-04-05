import fetch from "node-fetch";
import config from "./config.js";
import logger from "./utils/logger.js";

const PYTHON_EXECUTABLES = new Set(["python", "python3", "py"]);

function emitLine(text, stream, onLog) {
  for (const line of String(text).split(/\r?\n/)) {
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

function isPythonExecutable(value) {
  return PYTHON_EXECUTABLES.has(String(value || "").toLowerCase());
}

function extractCodeFromCommand(command) {
  const parts = Array.isArray(command) ? command.map((part) => String(part)) : [];
  if (parts.length < 3 || !isPythonExecutable(parts[0]) || parts[1] !== "-c") {
    return null;
  }

  return parts.slice(2).join(" ");
}

function extractPythonCodeFromJob(job) {
  const candidates = [
    job?.python_code,
    job?.pythonCode,
    job?.code,
    job?.source_code,
    job?.sourceCode,
    job?.metadata?.python_code,
    job?.metadata?.pythonCode,
    job?.metadata?.code,
    extractCodeFromCommand(job?.command),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

function validatePythonCode(code) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Python code is required for remote GPU execution");
  }

  if (code.length > config.maxGpuCodeLength) {
    throw new Error(`Python code exceeds max length of ${config.maxGpuCodeLength} characters`);
  }
}

function buildFailureResult(job, startedAt, error, infrastructureFailure = true, failureReason = "execution_error") {
  return {
    status: "failed",
    logs: [],
    result: {
      exit_code: 1,
      output_files: [],
      duration_ms: Date.now() - startedAt,
      error: error.message,
      output: "",
      runner: "remote-gpu",
      gpu_server_url: config.gpuServerUrl,
      infrastructure_failure: infrastructureFailure,
      failure_reason: failureReason,
    },
  };
}

async function executeRemoteJob(job, code, hooks, attempt) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.gpuRequestTimeoutMs);
  const endpoint = `${config.gpuServerUrl}/run`;

  logger.info("Sending GPU execution request", {
    job_id: job.job_id,
    endpoint,
    attempt,
    timeout_ms: config.gpuRequestTimeoutMs,
    code_length: code.length,
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let payload = {};

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch (error) {
        throw new Error(`GPU server returned invalid JSON: ${error.message}`);
      }
    }

    if (!response.ok) {
      const detail = payload.error || rawBody || `${response.status} ${response.statusText}`;
      throw new Error(`GPU server request failed: ${detail}`);
    }

    const durationMs = Date.now() - startedAt;
    const output = typeof payload.output === "string" ? payload.output : "";
    const errorText =
      typeof payload.error === "string" && payload.error.trim() ? payload.error : null;

    logger.info("GPU execution response received", {
      job_id: job.job_id,
      attempt,
      duration_ms: durationMs,
      has_output: Boolean(output),
      has_error: Boolean(errorText),
    });

    emitLine(output, "stdout", hooks.onLog);
    emitLine(errorText, "stderr", hooks.onLog);

    const result = {
      exit_code: errorText ? 1 : 0,
      output_files: [],
      duration_ms: durationMs,
      output,
      error: errorText,
      runner: "remote-gpu",
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
    const durationMs = Date.now() - startedAt;
    const message =
      error.name === "AbortError"
        ? `timeout: GPU server request timed out after ${config.gpuRequestTimeoutMs}ms`
        : `offline: ${error.message}`;

    logger.warn("GPU execution request failed", {
      job_id: job.job_id,
      attempt,
      duration_ms: durationMs,
      error: message,
    });

    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}

async function runRemoteGpuJob(job, hooks = {}) {
  const startedAt = Date.now();

  try {
    const code = extractPythonCodeFromJob(job);
    validatePythonCode(code);

    const maxAttempts = config.gpuRequestRetries + 1;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await executeRemoteJob(job, code, hooks, attempt);
      } catch (error) {
        lastError = error;

        await hooks.onLog?.({
          stream: "stderr",
          text: `GPU attempt ${attempt}/${maxAttempts} failed for job ${job.job_id}: ${error.message}`,
          ts: new Date().toISOString(),
        });

        if (attempt < maxAttempts) {
          logger.warn("Retrying GPU execution request", {
            job_id: job.job_id,
            next_attempt: attempt + 1,
          });
        }
      }
    }

    const failureReason =
      lastError?.message?.startsWith("timeout:")
        ? "timeout"
        : "offline";
    const failure = buildFailureResult(
      job,
      startedAt,
      lastError || new Error("offline: GPU execution failed"),
      true,
      failureReason
    );
    await hooks.onFail?.(failure.result);
    return failure;
  } catch (error) {
    const failure = buildFailureResult(job, startedAt, error, false, "validation_error");
    await hooks.onFail?.(failure.result);
    return failure;
  }
}

export { extractPythonCodeFromJob, runRemoteGpuJob };
