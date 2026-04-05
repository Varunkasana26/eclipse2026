import config from "./config.js";
import { runDockerJob } from "./dockerRunner.js";
import { runLocalJob, runSimulatedJob } from "./fallbackRunner.js";
import { extractPythonCodeFromJob, runRemoteGpuJob } from "./remoteGpuRunner.js";
import { runRenderJob } from "./renderRunner.js";
import logger from "./utils/logger.js";

function shouldUseGpuRunner(job) {
  const requestedMode = (job.execution_mode || "local").toLowerCase();
  return (
    Boolean(extractPythonCodeFromJob(job)) &&
    (
      requestedMode === "gpu" ||
      requestedMode === "remote-gpu" ||
      Boolean(job.resource_requirements?.gpu_required)
    )
  );
}

function isRenderJob(job) {
  return String(job?.metadata?.job_type || job?.metadata?.jobType || "").toLowerCase() === "render";
}

async function runJob(job, hooks = {}, context = {}) {
  const requestedMode = (job.execution_mode || "local").toLowerCase();

  if (config.executorMode === "mock") {
    return runSimulatedJob(job, hooks);
  }

  if (isRenderJob(job)) {
    return runRenderJob(job, hooks, context);
  }

  if (requestedMode === "docker") {
    return runDockerJob(job, hooks);
  }

  if (shouldUseGpuRunner(job)) {
    const remoteResult = await runRemoteGpuJob(job, hooks);
    if (remoteResult.status === "completed") {
      return remoteResult;
    }

    logger.warn("Remote GPU execution failed", {
      job_id: job.job_id,
      gpu_server_url: config.gpuServerUrl,
      error: remoteResult.result?.error || null,
    });
    return remoteResult;
  }

  return runLocalJob(job, hooks);
}

export { runJob };
