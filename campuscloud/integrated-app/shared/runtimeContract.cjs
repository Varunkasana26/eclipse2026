const EVENT_TYPES = {
  SNAPSHOT: "snapshot",
  AGENT_REGISTER: "agent:register",
  AGENT_HEARTBEAT: "agent:heartbeat",
  NODE_UPDATE: "node:update",
  JOB_SUBMIT: "job:submit",
  JOB_ASSIGN: "job:assign",
  JOB_UPDATE: "job:update",
  JOB_LOG: "job:log",
  JOB_COMPLETE: "job:complete",
  JOB_FAILED: "job:failed",
};

const NODE_STATUS = {
  IDLE: "idle",
  BUSY: "busy",
  OFFLINE: "offline",
};

const JOB_STATUS = {
  QUEUED: "queued",
  ASSIGNED: "assigned",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};

const JOB_TERMINAL_STATUSES = new Set([JOB_STATUS.COMPLETED, JOB_STATUS.FAILED]);

const EXECUTION_MODE = {
  AUTO: "auto",
  LOCAL: "local",
  DOCKER: "docker",
  MOCK: "mock",
};

const JOB_TYPE = {
  DEFAULT: "default",
  PYTHON: "python",
  RENDER: "render",
};

const JOB_LANES = {
  LOW: "low",
  MID: "mid",
  HIGH: "high",
};

const DEFAULT_COMMAND = [
  "node",
  "-e",
  "console.log('CampusCloud demo job started'); setTimeout(() => console.log('CampusCloud demo job finished'), 750);",
];

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, min, max, fallback = min) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return fallback;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map((tag) => String(tag).trim()).filter(Boolean);
}

function normalizeExecutionMode(mode, fallback = EXECUTION_MODE.LOCAL) {
  const value = String(mode || "").trim().toLowerCase();
  return Object.values(EXECUTION_MODE).includes(value) ? value : fallback;
}

function normalizeLane(value, fallback = null) {
  const normalized = String(value || "").trim().toLowerCase();
  return Object.values(JOB_LANES).includes(normalized) ? normalized : fallback;
}

function normalizeJobType(value, fallback = JOB_TYPE.DEFAULT) {
  const normalized = String(value || "").trim().toLowerCase();
  return Object.values(JOB_TYPE).includes(normalized) ? normalized : fallback;
}

function tokenizeCommand(command) {
  const tokens = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\S+)/g;

  for (const match of command.matchAll(pattern)) {
    const token = match[1] ?? match[2] ?? match[3] ?? "";
    if (token) {
      tokens.push(token.replace(/\\(["'])/g, "$1"));
    }
  }

  return tokens;
}

function normalizeCommand(command) {
  if (Array.isArray(command)) {
    return command.map((part) => String(part)).filter(Boolean);
  }

  if (typeof command === "string") {
    const trimmed = command.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return normalizeCommand(JSON.parse(trimmed));
      } catch {
        return tokenizeCommand(trimmed);
      }
    }

    return tokenizeCommand(trimmed);
  }

  return [];
}

function stringifyCommand(command) {
  const parts = normalizeCommand(command);
  return parts
    .map((part) => {
      if (!/[\s"'\\]/.test(part)) {
        return part;
      }

      return `"${part.replace(/(["\\])/g, "\\$1")}"`;
    })
    .join(" ");
}

function normalizeResourceRequirements(value = {}, fallbacks = {}) {
  return {
    gpu_required: parseBoolean(value.gpu_required ?? value.requires_gpu, Boolean(fallbacks.gpu_required)),
    gpu_count: Math.max(0, Number(value.gpu_count ?? fallbacks.gpu_count) || 0),
    min_gpu_memory_mb: Math.max(
      0,
      Number(value.min_gpu_memory_mb ?? value.vram_mb ?? fallbacks.min_gpu_memory_mb) || 0
    ),
    min_ram_mb: Math.max(0, Number(value.min_ram_mb ?? fallbacks.min_ram_mb) || 0),
    required_tags: normalizeTags(value.required_tags ?? fallbacks.required_tags),
  };
}

function buildWorkerRegistrationPayload({
  workerId,
  workerName,
  workerTags,
  executorMode,
  workspaceId,
  nodeLane,
  maxAllocPercent,
  allowDocker,
  systemInfo,
  agentVersion,
}) {
  return {
    worker_id: workerId || systemInfo?.hostname,
    worker_name: workerName || systemInfo?.hostname,
    node_name: workerName || systemInfo?.hostname,
    workspace_id: workspaceId || "demo-workspace",
    node_lane: normalizeLane(nodeLane),
    max_alloc_percent: clampNumber(maxAllocPercent, 1, 100, 70),
    allow_docker: parseBoolean(allowDocker, true),
    agent_version: agentVersion || "1.1.0",
    executor_mode: normalizeExecutionMode(executorMode, EXECUTION_MODE.AUTO),
    tags: normalizeTags(workerTags),
    hostname: systemInfo?.hostname || workerId || workerName || "",
    platform: systemInfo?.platform || "",
    arch: systemInfo?.arch || "",
    os_type: systemInfo?.os_type || "",
    node_version: systemInfo?.node_version || "",
    cpu: clone(systemInfo?.cpu || {}),
    ram: clone(systemInfo?.ram || {}),
    gpu: clone(systemInfo?.gpu || { gpu_available: false, gpu_count: 0, gpus: [] }),
    docker: clone(
      systemInfo?.docker || {
        docker_available: false,
        docker_version: null,
      }
    ),
  };
}

function buildHeartbeatPayload({ workerId, status, currentJobId, timestamp }) {
  return {
    worker_id: workerId,
    status,
    current_job_id: currentJobId || null,
    timestamp: timestamp || nowIso(),
  };
}

function buildJobStatusPayload({ workerId, status, extra = {} }) {
  return {
    worker_id: workerId,
    status,
    timestamp: extra.timestamp || nowIso(),
    ...extra,
  };
}

function buildAgentJobPayload(job) {
  const metadata = clone(job.metadata || {});
  if (metadata.job_type) {
    metadata.job_type = normalizeJobType(metadata.job_type);
  }

  return {
    job_id: job.id,
    parent_job_id: job.parent_job_id || null,
    chunk_index: Number.isInteger(job.chunk_index) ? job.chunk_index : null,
    chunk_total: Number(job.chunk_total || job.chunk_count || 1),
    workspace_id: job.workspace_id || "demo-workspace",
    lane_required: normalizeLane(job.lane_required),
    estimated_gpu_percent: Math.max(0, Number(job.estimated_gpu_percent) || 0),
    image: job.image,
    command: normalizeCommand(job.command_args || job.command || DEFAULT_COMMAND),
    env: clone(job.env || {}),
    execution_mode: normalizeExecutionMode(job.execution_mode || job.executionMode, EXECUTION_MODE.LOCAL),
    timeout_ms: Number(job.metadata?.timeout_ms) || 300000,
    resource_requirements: normalizeResourceRequirements(job.resourceRequirements || {}, {
      gpu_required: job.requires_gpu,
      min_gpu_memory_mb: job.vram_mb,
    }),
    metadata,
  };
}

module.exports = {
  EVENT_TYPES,
  NODE_STATUS,
  JOB_STATUS,
  JOB_TERMINAL_STATUSES,
  EXECUTION_MODE,
  JOB_TYPE,
  JOB_LANES,
  DEFAULT_COMMAND,
  nowIso,
  clone,
  clampNumber,
  parseBoolean,
  normalizeTags,
  normalizeExecutionMode,
  normalizeLane,
  normalizeJobType,
  normalizeCommand,
  stringifyCommand,
  normalizeResourceRequirements,
  buildWorkerRegistrationPayload,
  buildHeartbeatPayload,
  buildJobStatusPayload,
  buildAgentJobPayload,
};
