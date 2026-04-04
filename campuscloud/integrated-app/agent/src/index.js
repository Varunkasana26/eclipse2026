import WorkerAgent from "./agent.js";
import { registerWorker } from "./api.js";
import config from "./config.js";
import { getSystemInfo } from "./systemInfo.js";
import logger from "./utils/logger.js";

async function attemptRegistration(systemInfo) {
  while (true) {
    try {
      await registerWorker(systemInfo);
      logger.info("Worker registered with backend", {
        worker_id: config.workerId || systemInfo.hostname,
        backend_url: config.backendUrl
      });
      return;
    } catch (error) {
      logger.warn("Worker registration failed, retrying in 5 seconds", {
        worker_id: config.workerId || systemInfo.hostname,
        error: error.message
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function main() {
  const systemInfo = await getSystemInfo();

  logger.info("Worker startup system info", {
    worker_id: config.workerId || systemInfo.hostname,
    executor_mode: config.executorMode,
    gpu_available: systemInfo.gpu.gpu_available,
    gpu_count: systemInfo.gpu.gpu_count,
    gpu_names: systemInfo.gpu.gpus.map((gpu) => gpu.name)
  });

  if (!systemInfo.gpu.gpu_available) {
    logger.warn("No NVIDIA GPU detected", {
      worker_id: config.workerId || systemInfo.hostname
    });
  }

  if (config.executorMode === "docker" && !systemInfo.docker.docker_available) {
    logger.warn("Docker executor mode selected but Docker is unavailable", {
      worker_id: config.workerId || systemInfo.hostname
    });
  }

  await attemptRegistration(systemInfo);
  const agent = new WorkerAgent(systemInfo);

  const shutdown = () => {
    logger.info("Shutting down worker agent", {
      worker_id: config.workerId || systemInfo.hostname
    });
    agent.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await agent.start();
}

main().catch((error) => {
  logger.error("Fatal startup error", { error: error.message });
  process.exit(1);
});
