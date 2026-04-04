import config from "./config.js";
import { extractPythonCodeFromJob, runDockerJob } from "./dockerRunner.js";
import { runLocalJob, runSimulatedJob } from "./fallbackRunner.js";
import { runRenderJob } from "./renderRunner.js";
import logger from "./utils/logger.js";

async function emitFallbackLog(hooks, message) {
  await hooks.onLog?.({
    stream: "stdout",
    text: message,
    ts: new Date().toISOString(),
  });
}

function shouldUseGpuRunner(job) {
  const requestedMode = (job.execution_mode || "local").toLowerCase();
  return (
    Boolean(extractPythonCodeFromJob(job)) &&
    (
      requestedMode === "docker" ||
      requestedMode === "gpu" ||
      Boolean(job.resource_requirements?.gpu_required)
    )
  );
}

function isRenderJob(job) {
  return String(job?.metadata?.job_type || "").toLowerCase() === "render";
}

function buildFallbackJob(job, pythonCode) {
  if (Array.isArray(job.command) && job.command.length > 0) {
    return job;
  }

  if (!pythonCode) {
    return job;
  }

  return {
    ...job,
    command: ["python", "-c", pythonCode],
    execution_mode: "local",
  };
}

async function runJob(job, hooks = {}, context = {}) {
  const requestedMode = (job.execution_mode || "local").toLowerCase();
  const pythonCode = extractPythonCodeFromJob(job);

  if (config.executorMode === "mock") {
    return runSimulatedJob(job, hooks);
  }

  if (isRenderJob(job)) {
    return runRenderJob(job, hooks, context);
  }

  if (shouldUseGpuRunner(job)) {
    const remoteResult = await runDockerJob(job, hooks);
    if (
      remoteResult.status === "completed" ||
      remoteResult.result?.infrastructure_failure === false
    ) {
      return remoteResult;
    }

    logger.warn("Remote GPU execution failed, using fallback runner", {
      job_id: job.job_id,
      gpu_server_url: config.gpuServerUrl,
      error: remoteResult.result?.error || null,
    });

    await emitFallbackLog(
      hooks,
      `GPU execution failed for job ${job.job_id}. Falling back to local execution.`
    );

    const fallbackResult = await runLocalJob(buildFallbackJob(job, pythonCode), hooks);
    return {
      ...fallbackResult,
      result: {
        ...(fallbackResult.result || {}),
        fallback_from: "gpu_server",
        gpu_server_url: config.gpuServerUrl,
      },
    };
  }

  if (requestedMode === "docker") {
    await emitFallbackLog(
      hooks,
      `Docker mode requested for job ${job.job_id}, but only Python GPU tasks are routed remotely. Falling back to local execution.`
    );
  }

  return runLocalJob(job, hooks);
}

export { runJob };
