import { spawn } from "node:child_process";
import config from "./config.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeExecutable(command) {
  const executable = String(command?.[0] || "").toLowerCase();
  if (executable === "node") {
    return process.execPath;
  }

  if (["python", "python3", "py"].includes(executable)) {
    return command[0];
  }

  return null;
}

function isRenderJob(job) {
  return String(job?.metadata?.job_type || job?.metadata?.jobType || "").toLowerCase() === "render";
}

function getRequestedExecutable(job) {
  return String(job?.command?.[0] || "").trim() || "unknown";
}

async function failUnsupportedCommand(job, hooks = {}, startedAt = Date.now()) {
  const executable = getRequestedExecutable(job);
  const error = isRenderJob(job)
    ? `Render jobs require remote render execution. Unsupported local executable: ${executable}`
    : `Unsupported local executable for fallback runner: ${executable}`;
  const result = {
    exit_code: 1,
    output_files: [],
    duration_ms: Date.now() - startedAt,
    error,
    failure_reason: "validation_error",
  };

  await hooks.onFail?.(result);

  return {
    status: "failed",
    logs: [],
    result,
  };
}

async function runSimulatedJob(job, hooks = {}) {
  const startedAt = Date.now();
  const durationMs = job.mock_duration_ms || config.mockJobDurationMs;
  const intervalMs = Math.max(250, config.mockLogIntervalMs);
  const steps = Math.max(1, Math.ceil(durationMs / intervalMs));

  for (let index = 0; index < steps; index += 1) {
    await sleep(intervalMs);
    await hooks.onLog?.({
      stream: "stdout",
      text: `fallback runner step ${index + 1}/${steps} for job ${job.job_id}`,
      ts: new Date().toISOString(),
    });
  }

  const failed = Boolean(job.mock_should_fail);
  const result = {
    exit_code: failed ? 1 : 0,
    output_files: failed ? [] : [{ name: "result.json", path: `/mock/${job.job_id}/result.json` }],
    duration_ms: Date.now() - startedAt,
    error: failed ? "Simulated fallback job failed." : null,
  };

  if (failed) {
    await hooks.onFail?.(result);
  } else {
    await hooks.onComplete?.(result);
  }

  return {
    status: failed ? "failed" : "completed",
    logs: [],
    result,
  };
}

async function runLocalJob(job, hooks = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const executable = safeExecutable(job.command);
    let timedOut = false;
    let forceKillTimer = null;
    if (!executable) {
      failUnsupportedCommand(job, hooks, startedAt).then(resolve);
      return;
    }

    const proc = spawn(executable, job.command.slice(1), {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      env: {
        ...process.env,
        ...(job.env || {}),
      },
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

    const forwardLogs = async (chunk, stream) => {
      for (const line of String(chunk).split(/\r?\n/)) {
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
      await hooks.onFail?.();
      resolve({
        status: "failed",
        logs: [],
        result: {
          exit_code: 1,
          output_files: [],
          duration_ms: Date.now() - startedAt,
          error: error.message,
          failure_reason: "execution_error",
        },
      });
    });

    proc.on("close", async (exitCode, signal) => {
      clearTimeout(timeout);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }
      const result = {
        exit_code: typeof exitCode === "number" ? exitCode : -1,
        output_files: [],
        duration_ms: Date.now() - startedAt,
        signal: signal || null,
        error: timedOut
          ? `timeout: Local job exceeded ${timeoutMs}ms and was terminated`
          : exitCode === 0
            ? null
            : `Local job exited with code ${exitCode}`,
        failure_reason: timedOut ? "timeout" : exitCode === 0 ? null : "execution_error",
      };

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

export { runLocalJob, runSimulatedJob };
