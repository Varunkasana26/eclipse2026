import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function toMb(bytes) {
  return Math.round(bytes / (1024 * 1024));
}

function toGb(bytes) {
  return Number((bytes / (1024 * 1024 * 1024)).toFixed(2));
}

function parseNumeric(value) {
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

async function getGpuInfo() {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", [
      "--query-gpu=name,memory.total,driver_version,uuid,compute_cap,power.limit",
      "--format=csv,noheader,nounits"
    ]);

    const gpus = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, memoryTotal, driverVersion, uuid, computeCap, powerLimit] = line
          .split(",")
          .map((part) => part.trim());

        const memoryMb = parseNumeric(memoryTotal) ?? 0;

        return {
          index,
          name,
          memory_mb: memoryMb,
          memory_gb: Number((memoryMb / 1024).toFixed(2)),
          driver_version: driverVersion || "",
          uuid: uuid || "",
          compute_cap: computeCap || "",
          power_limit_w: parseNumeric(powerLimit)
        };
      });

    return {
      gpu_available: gpus.length > 0,
      gpu_count: gpus.length,
      gpus
    };
  } catch {
    return {
      gpu_available: false,
      gpu_count: 0,
      gpus: []
    };
  }
}

async function getDockerInfo() {
  try {
    const { stdout } = await execFileAsync("docker", ["info", "--format", "{{.ServerVersion}}"]);
    const dockerVersion = stdout.trim();

    return {
      docker_available: Boolean(dockerVersion),
      docker_version: dockerVersion || null
    };
  } catch {
    return {
      docker_available: false,
      docker_version: null
    };
  }
}

async function getSystemInfo() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const [gpu, docker] = await Promise.all([getGpuInfo(), getDockerInfo()]);

  return {
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
    os_type: os.type(),
    node_version: process.version,
    uptime_s: Math.round(os.uptime()),
    cpu: {
      model: cpus[0]?.model || "unknown",
      cores: cpus.length,
      speed_mhz: cpus[0]?.speed || 0
    },
    ram: {
      total_mb: toMb(totalMem),
      free_mb: toMb(freeMem),
      total_gb: toGb(totalMem)
    },
    gpu,
    docker
  };
}

export { getGpuInfo, getDockerInfo, getSystemInfo };
