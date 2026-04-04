import express from "express";
import fs from "node:fs";
import path from "node:path";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFile(path.resolve(__dirname, "..", ".env"));

const config = {
  port: parseNumber(process.env.PORT, 8000),
  maxConcurrentJobs: parseNumber(process.env.MAX_CONCURRENT_JOBS, 2),
  defaultTimeoutMs: parseNumber(process.env.DEFAULT_TIMEOUT_MS, 300000),
  gpuDevice: process.env.GPU_DEVICE || "all",
  dockerPullPolicy: process.env.DOCKER_PULL_POLICY || "missing",
  logLevel: process.env.LOG_LEVEL || "info",
  sharedVolumeHost: process.env.SHARED_VOLUME_HOST || "",
  sharedVolumeContainer: process.env.SHARED_VOLUME_CONTAINER || "/data"
};

const app = express();
const jobs = new Map();
let runningCount = 0;

app.use(express.json({ limit: "1mb" }));

function log(level, message, meta = {}) {
  process.stdout.write(
    `${JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      ...meta
    })}\n`
  );
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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
    log("warn", "Failed to load .env file", { file_path: filePath, error: error.message });
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

async function detectGpu() {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", [
      "--query-gpu=name,memory.total",
      "--format=csv,noheader,nounits"
    ]);

    const gpus = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, memory] = line.split(",").map((part) => part.trim());
        return {
          index,
          name,
          memory_mb: parseNumber(memory, 0)
        };
      });

    return {
      available: gpus.length > 0,
      gpus
    };
  } catch {
    return {
      available: false,
      gpus: []
    };
  }
}

function buildDockerArgs(jobSpec, gpu) {
  const resourceRequirements = jobSpec.resource_requirements || {};
  const args = [
    "run",
    "--rm",
    "--name",
    `campuscloud-${jobSpec.job_id}`,
    "--pull",
    config.dockerPullPolicy
  ];

  if (resourceRequirements.gpu_required) {
    if (!gpu.available) {
      throw new Error("Job requires GPU but no NVIDIA GPU detected");
    }

    if ((resourceRequirements.gpu_count || 0) === 1) {
      args.push("--gpus", "device=0");
    } else {
      args.push("--gpus", config.gpuDevice);
    }
  } else {
    args.push("--memory", "4g", "--cpus", "2");
  }

  for (const [key, value] of Object.entries(jobSpec.env || {})) {
    args.push("-e", `${key}=${String(value)}`);
  }

  if (config.sharedVolumeHost) {
    args.push("-v", `${config.sharedVolumeHost}:${config.sharedVolumeContainer}:ro`);
  }

  args.push(jobSpec.image);

  for (const arg of Array.isArray(jobSpec.command) ? jobSpec.command : []) {
    args.push(String(arg));
  }

  return args;
}

function appendLog(job, stream, text) {
  const line = String(text);
  if (!line.trim()) {
    return;
  }

  job.logs.push({
    stream,
    text: line,
    ts: new Date().toISOString()
  });
}

function finalizeJob(jobId, status, result) {
  const job = jobs.get(jobId);
  if (!job || job.status !== "running") {
    return;
  }

  job.status = status;
  job.result = result;
  job.proc = null;

  if (job.timeoutHandle) {
    clearTimeout(job.timeoutHandle);
    job.timeoutHandle = null;
  }

  runningCount = Math.max(0, runningCount - 1);
}

app.post("/execute", async (req, res) => {
  try {
    const jobSpec = req.body || {};

    if (!jobSpec.job_id || !jobSpec.image) {
      return res.status(400).json({ error: "job_id and image are required" });
    }

    if (jobs.has(jobSpec.job_id)) {
      return res.status(409).json({ error: "Job already exists" });
    }

    if (runningCount >= config.maxConcurrentJobs) {
      return res.status(429).json({ error: "Execution service is at max concurrency" });
    }

    const gpu = await detectGpu();
    try {
      const dockerArgs = buildDockerArgs(jobSpec, gpu);
      const timeoutMs = parseNumber(jobSpec.timeout_ms, config.defaultTimeoutMs);
      const job = {
        status: "running",
        logs: [],
        result: null,
        proc: null,
        startedAt: Date.now(),
        timeoutHandle: null
      };

      jobs.set(jobSpec.job_id, job);
      runningCount += 1;

      const proc = spawn("docker", dockerArgs, {
        stdio: ["ignore", "pipe", "pipe"]
      });

      job.proc = proc;

      proc.stdout.on("data", (chunk) => {
        for (const line of String(chunk).split(/\r?\n/)) {
          appendLog(job, "stdout", line);
        }
      });

      proc.stderr.on("data", (chunk) => {
        for (const line of String(chunk).split(/\r?\n/)) {
          appendLog(job, "stderr", line);
        }
      });

      proc.on("error", (error) => {
        appendLog(job, "stderr", `Docker spawn error: ${error.message}`);
        finalizeJob(jobSpec.job_id, "failed", {
          exit_code: -1,
          error: error.message
        });
      });

      proc.on("close", (exitCode, signal) => {
        if (job.status !== "running") {
          return;
        }

        finalizeJob(jobSpec.job_id, exitCode === 0 ? "completed" : "failed", {
          exit_code: typeof exitCode === "number" ? exitCode : -1,
          signal: signal || null,
          duration_ms: Date.now() - job.startedAt
        });
      });

      job.timeoutHandle = setTimeout(() => {
        if (job.status !== "running") {
          return;
        }

        appendLog(job, "stderr", `Job timed out after ${timeoutMs}ms`);
        try {
          proc.kill("SIGTERM");
        } catch {
          return;
        }

        setTimeout(() => {
          if (job.status === "running") {
            try {
              proc.kill("SIGKILL");
            } catch {
              return;
            }
          }
        }, 5000);

        finalizeJob(jobSpec.job_id, "failed", {
          exit_code: -1,
          error: `Job timed out after ${timeoutMs}ms`,
          duration_ms: Date.now() - job.startedAt
        });
      }, timeoutMs);

      return res.status(202).json({ job_id: jobSpec.job_id, status: "accepted" });
    } catch (error) {
      if (String(error.message).includes("no NVIDIA GPU detected")) {
        return res.status(422).json({ error: error.message });
      }

      throw error;
    }
  } catch (error) {
    log("error", "Failed to accept execution request", { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

app.get("/status/:job_id", (req, res) => {
  try {
    const job = jobs.get(req.params.job_id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({
      job_id: req.params.job_id,
      status: job.status,
      logs: job.logs,
      result: job.result,
      elapsed_ms: Date.now() - job.startedAt
    });
  } catch (error) {
    log("error", "Failed to fetch job status", {
      job_id: req.params.job_id,
      error: error.message
    });
    return res.status(500).json({ error: error.message });
  }
});

app.post("/cancel/:job_id", (req, res) => {
  try {
    const job = jobs.get(req.params.job_id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "running") {
      return res.json({ job_id: req.params.job_id, status: job.status, result: job.result });
    }

    try {
      job.proc?.kill("SIGTERM");
    } catch {
      log("warn", "Failed to send SIGTERM to job", { job_id: req.params.job_id });
    }

    setTimeout(() => {
      if (job.status === "running") {
        try {
          job.proc?.kill("SIGKILL");
        } catch {
          log("warn", "Failed to send SIGKILL to job", { job_id: req.params.job_id });
        }
      }
    }, 5000);

    appendLog(job, "stderr", "Cancelled by agent");
    finalizeJob(req.params.job_id, "failed", {
      exit_code: -1,
      error: "Cancelled by agent",
      duration_ms: Date.now() - job.startedAt
    });

    return res.json({ job_id: req.params.job_id, status: "failed" });
  } catch (error) {
    log("error", "Failed to cancel job", { job_id: req.params.job_id, error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

app.get("/health", async (_req, res) => {
  try {
    const gpu = await detectGpu();
    return res.json({
      status: "ok",
      running_jobs: runningCount,
      max_concurrent: config.maxConcurrentJobs,
      gpu_available: gpu.available,
      gpus: gpu.gpus,
      uptime_s: Math.round(process.uptime())
    });
  } catch (error) {
    log("error", "Health check failed", { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

async function start() {
  try {
    const gpu = await detectGpu();
    log("info", "Execution service GPU detection complete", {
      gpu_available: gpu.available,
      gpu_count: gpu.gpus.length,
      gpus: gpu.gpus
    });

    app.listen(config.port, "127.0.0.1", () => {
      log("info", "Execution service listening", {
        host: "127.0.0.1",
        port: config.port,
        max_concurrent_jobs: config.maxConcurrentJobs
      });
    });
  } catch (error) {
    log("error", "Execution service failed to start", { error: error.message });
    process.exit(1);
  }
}

start();
