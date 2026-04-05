import { spawn } from "node:child_process";
import logger from "./utils/logger.js";
import { extractPythonCodeFromJob } from "./remoteGpuRunner.js";

function buildDockerResult(startedAt, overrides = {}) {
  return {
    exit_code: 1,
    output_files: [],
    duration_ms: Date.now() - startedAt,
    output: "",
    error: "Docker execution failed",
    runner: "docker",
    ...overrides,
  };
}

function getJobCommand(job) {
  if (Array.isArray(job?.command) && job.command.length > 0) {
    return job.command.map((part) => String(part));
  }

  const pythonCode = extractPythonCodeFromJob(job);
  if (pythonCode) {
    return ["python", "-c", pythonCode];
  }

  return [];
}

function getJobImage(job, useGpu) {
  const image = String(job?.image || "").trim();
  if (image) {
    return image;
  }

  return useGpu ? "" : "python:3.10-slim";
}

function getDockerArgs(job) {
  const useGpu = Boolean(job?.resource_requirements?.gpu_required);
  const image = getJobImage(job, useGpu);
  const command = getJobCommand(job);

  if (!image) {
    throw new Error("Docker image is required for GPU container jobs");
  }

  if (command.length === 0) {
    throw new Error("Docker jobs require a command or inline Python code");
  }

  const args = ["run", "--rm"];

  if (useGpu) {
    args.push("--gpus", "all");
  }

  for (const [key, value] of Object.entries(job?.env || {})) {
    if (value === undefined || value === null) {
      continue;
    }

    args.push("-e", `${key}=${String(value)}`);
  }

  args.push(image, ...command);
  return { args, image, command, useGpu };
}

async function runDockerJob(job, hooks = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let dockerMeta;
    let timedOut = false;
    let forceKillTimer = null;

    try {
      dockerMeta = getDockerArgs(job);
    } catch (error) {
      const result = buildDockerResult(startedAt, {
        error: error.message,
        failure_reason: "validation_error",
      });
      Promise.resolve(hooks.onFail?.(result)).catch(() => {});
      resolve({ status: "failed", logs: [], result });
      return;
    }

    logger.info("Starting Docker job", {
      job_id: job.job_id,
      image: dockerMeta.image,
      use_gpu: dockerMeta.useGpu,
      command: dockerMeta.command,
    });

    const proc = spawn("docker", dockerMeta.args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      env: process.env,
    });

    const timeoutMs = Number(job.timeout_ms) || 300000;
    const timeout = setTimeout(() => {
      timedOut = true;
      try {
        proc.kill("SIGTERM");
      } catch {
        return;
      }

      forceKillTimer = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          return;
        }
      }, 5000);
    }, timeoutMs);

    let stdout = "";
    let stderr = "";

    const forwardLogs = async (chunk, stream) => {
      const text = String(chunk);
      if (stream === "stdout") {
        stdout += text;
      } else {
        stderr += text;
      }

      for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) {
          continue;
        }

        await hooks.onLog?.({
          stream,
          text: line,
          ts: new Date().toISOString(),
        });
      }
    };

    proc.stdout.on("data", (chunk) => {
      forwardLogs(chunk, "stdout").catch(() => {});
    });

    proc.stderr.on("data", (chunk) => {
      forwardLogs(chunk, "stderr").catch(() => {});
    });

    proc.on("error", async (error) => {
      clearTimeout(timeout);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }
      const result = buildDockerResult(startedAt, {
        error: error.message,
        output: stdout,
        failure_reason: "execution_error",
      });
      await hooks.onFail?.(result);
      resolve({ status: "failed", logs: [], result });
    });

    proc.on("close", async (exitCode, signal) => {
      clearTimeout(timeout);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }

      const result = buildDockerResult(startedAt, {
        exit_code: typeof exitCode === "number" ? exitCode : -1,
        output: stdout,
        error:
          timedOut
            ? `timeout: Docker job exceeded ${timeoutMs}ms and was terminated`
            : exitCode === 0
            ? null
            : stderr.trim() || `Docker job exited with code ${exitCode}${signal ? ` (${signal})` : ""}`,
        signal: signal || null,
        failure_reason: timedOut ? "timeout" : exitCode === 0 ? null : "execution_error",
      });

      if (exitCode === 0) {
        await hooks.onComplete?.(result);
      } else {
        await hooks.onFail?.(result);
      }

      resolve({
        status: exitCode === 0 ? "completed" : "failed",
        logs: [],
        result,
      });
    });
  });
}

export { runDockerJob };
