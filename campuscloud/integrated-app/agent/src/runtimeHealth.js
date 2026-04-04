import { execFile } from "node:child_process";
import { promisify } from "node:util";
import config from "./config.js";
import logger from "./utils/logger.js";

const execFileAsync = promisify(execFile);

async function checkDockerCli() {
  const { stdout } = await execFileAsync("docker", ["--version"], {
    windowsHide: true,
    timeout: config.healthCheckTimeoutMs,
  });

  return stdout.trim();
}

async function checkDockerContainer() {
  const { stdout } = await execFileAsync(
    "docker",
    ["run", "--rm", config.dockerHealthCheckImage, "python", "--version"],
    {
      windowsHide: true,
      timeout: config.healthCheckTimeoutMs,
    }
  );

  return stdout.trim();
}

async function checkGpuContainer() {
  const { stdout } = await execFileAsync(
    "docker",
    ["run", "--rm", "--gpus", "all", config.gpuHealthCheckImage, "nvidia-smi"],
    {
      windowsHide: true,
      timeout: config.healthCheckTimeoutMs,
      maxBuffer: 1024 * 1024,
    }
  );

  return stdout.trim();
}

async function ensureRuntimeHealth(systemInfo) {
  const summary = {
    docker_required: config.startupRequireDocker,
    gpu_docker_required: config.startupRequireGpuDocker,
    allow_docker: config.allowDocker,
    gpu_available: Boolean(systemInfo?.gpu?.gpu_available),
  };

  if (!config.startupRequireDocker && !config.startupRequireGpuDocker) {
    logger.info("Runtime health checks skipped", summary);
    return;
  }

  if (config.startupRequireDocker || config.allowDocker) {
    const dockerVersion = await checkDockerCli();
    logger.info("Docker CLI health check passed", {
      ...summary,
      docker_version: dockerVersion,
    });

    const containerResult = await checkDockerContainer();
    logger.info("Docker container health check passed", {
      image: config.dockerHealthCheckImage,
      result: containerResult,
    });
  }

  if (config.startupRequireGpuDocker) {
    if (!systemInfo?.gpu?.gpu_available) {
      throw new Error("GPU Docker health check is enabled but no NVIDIA GPU was detected on this worker");
    }

    const gpuResult = await checkGpuContainer();
    logger.info("GPU Docker health check passed", {
      image: config.gpuHealthCheckImage,
      result_preview: gpuResult.split(/\r?\n/).slice(0, 3),
    });
  }
}

export { ensureRuntimeHealth };
