import config from "./config.js";
import { runDockerJob } from "./dockerRunner.js";
import { runLocalJob, runSimulatedJob } from "./fallbackRunner.js";

async function emitFallbackLog(hooks, message) {
  await hooks.onLog?.({
    stream: "stdout",
    text: message,
    ts: new Date().toISOString(),
  });
}

async function runJob(job, hooks = {}, context = {}) {
  const requestedMode = (job.execution_mode || "local").toLowerCase();
  const dockerAvailable = Boolean(context.systemInfo?.docker?.docker_available);

  if (config.executorMode === "mock") {
    return runSimulatedJob(job, hooks);
  }

  if (requestedMode === "docker") {
    if (dockerAvailable) {
      const dockerResult = await runDockerJob(job, hooks);
      if (dockerResult.status === "completed") {
        return dockerResult;
      }

      await emitFallbackLog(
        hooks,
        `Docker execution failed for job ${job.job_id}. Falling back to local execution.`
      );
    } else {
      await emitFallbackLog(
        hooks,
        `Docker is unavailable on this node. Falling back to local execution for job ${job.job_id}.`
      );
    }

    const fallbackResult = await runLocalJob(job, hooks);
    return {
      ...fallbackResult,
      result: {
        ...(fallbackResult.result || {}),
        fallback_from: "docker",
      },
    };
  }

  return runLocalJob(job, hooks);
}

export { runJob };
