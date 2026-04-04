import { spawn } from "node:child_process";

function emitLine(chunk, stream, onLog) {
  for (const line of String(chunk).split(/\r?\n/)) {
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

function buildDockerArgs(job) {
  const resourceRequirements = job.resource_requirements || {};
  const args = ["run", "--rm", "--name", `campuscloud-${job.job_id}`];

  if (resourceRequirements.gpu_required) {
    args.push("--gpus", resourceRequirements.gpu_count === 1 ? "device=0" : "all");
  } else {
    args.push("--memory", "4g", "--cpus", "2");
  }

  for (const [key, value] of Object.entries(job.env || {})) {
    args.push("-e", `${key}=${String(value)}`);
  }

  args.push(job.image);

  for (const arg of Array.isArray(job.command) ? job.command : []) {
    args.push(String(arg));
  }

  return args;
}

async function runDockerJob(job, hooks = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const proc = spawn("docker", buildDockerArgs(job), {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    const timeoutMs = Number(job.timeout_ms) || 300000;
    const timeout = setTimeout(() => {
      try {
        proc.kill("SIGTERM");
      } catch {
        return;
      }
    }, timeoutMs);

    proc.stdout.on("data", (chunk) => emitLine(chunk, "stdout", hooks.onLog));
    proc.stderr.on("data", (chunk) => emitLine(chunk, "stderr", hooks.onLog));

    proc.on("error", async (error) => {
      clearTimeout(timeout);
      await hooks.onFail?.();
      resolve({
        status: "failed",
        logs: [],
        result: {
          exit_code: 1,
          output_files: [],
          duration_ms: Date.now() - startedAt,
          error: error.message,
        },
      });
    });

    proc.on("close", async (exitCode, signal) => {
      clearTimeout(timeout);
      const result = {
        exit_code: typeof exitCode === "number" ? exitCode : -1,
        output_files: [],
        duration_ms: Date.now() - startedAt,
        signal: signal || null,
        error: exitCode === 0 ? null : `Docker job exited with code ${exitCode}`,
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

export { runDockerJob };
