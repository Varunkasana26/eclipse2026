import config from "./config.js";
import { runDockerJob } from "./dockerRunner.js";
import { runLocalJob, runSimulatedJob } from "./fallbackRunner.js";

async function runJob(job, hooks = {}, context = {}) {
  const requestedMode = (job.execution_mode || "local").toLowerCase();
  const dockerAvailable = Boolean(context.systemInfo?.docker?.docker_available);

  if (config.executorMode === "mock") {
    return runSimulatedJob(job, hooks);
  }

  if (requestedMode === "docker" && dockerAvailable) {
    return runDockerJob(job, hooks);
  }

  return runLocalJob(job, hooks);
}

export { runJob };
