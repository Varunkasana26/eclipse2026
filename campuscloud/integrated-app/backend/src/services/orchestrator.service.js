const { EventEmitter } = require("events");
const { randomBytes, randomUUID } = require("crypto");
const { createStore } = require("../models/store");
const {
  EVENT_TYPES,
  EXECUTION_MODE,
  JOB_LANES,
  JOB_STATUS,
  JOB_TERMINAL_STATUSES,
  NODE_STATUS,
  DEFAULT_COMMAND,
  buildAgentJobPayload,
  clampNumber,
  clone,
  normalizeCommand,
  normalizeExecutionMode,
  normalizeLane,
  normalizeResourceRequirements,
  normalizeTags,
  nowIso,
  parseBoolean,
  stringifyCommand,
} = require("../../../shared/runtimeContract.cjs");

const ACTIVE_JOB_STATUSES = new Set([JOB_STATUS.ASSIGNED, JOB_STATUS.RUNNING]);
const DEFAULT_WORKSPACE_ID = "demo-workspace";
const DEFAULT_GPU_INFO = { gpu_available: false, gpu_count: 0, gpus: [] };
const DEFAULT_DOCKER_INFO = { docker_available: false, docker_version: null };

function parseLogs(logs) {
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs
    .filter((entry) => entry && typeof entry.text === "string")
    .map((entry) => ({
      stream: entry.stream === "stderr" ? "stderr" : "stdout",
      text: entry.text,
      ts: entry.ts || nowIso(),
    }));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function createWorkerToken() {
  return randomBytes(24).toString("hex");
}

function normalizeWorkspaceId(value, fallback = DEFAULT_WORKSPACE_ID) {
  const workspaceId = String(value || "").trim();
  return workspaceId || fallback;
}

function pickGpuList(gpu) {
  return Array.isArray(gpu?.gpus) ? gpu.gpus : [];
}

function inferLaneFromVram(vramMb) {
  if ((Number(vramMb) || 0) >= 20000) {
    return JOB_LANES.HIGH;
  }
  if ((Number(vramMb) || 0) >= 10000) {
    return JOB_LANES.MID;
  }
  return JOB_LANES.LOW;
}

function summarizeGpu(node) {
  if (!node.gpu_available || !node.gpu_name) {
    return "No GPU";
  }

  return `${node.gpu_name} ${Number(((node.vram_mb || 0) / 1024).toFixed(0))}GB`;
}

function safeClone(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return clone(value);
}

function getTimeMs(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function createOrchestratorService(options = {}) {
  const store = createStore();
  const events = new EventEmitter();
  const heartbeatTimeoutMs = Number(options.heartbeatTimeoutMs) || 15000;
  const maxLogsPerJob = Number(options.maxLogsPerJob) || 500;
  const backendPublicUrl = String(options.backendPublicUrl || "http://127.0.0.1:5000").replace(/\/+$/, "");
  const fallbackWorkerSecret = String(options.workerSecret || "");
  const defaultWorkspaceId = normalizeWorkspaceId(options.defaultWorkspaceId, DEFAULT_WORKSPACE_ID);
  const defaultMaxAllocPercent = clampNumber(options.defaultMaxAllocPercent, 1, 100, 70);

  function emit(event, payload) {
    events.emit("message", {
      event,
      payload,
      ts: nowIso(),
    });
  }

  function isFresh(node, now = Date.now()) {
    return now - getTimeMs(node.lastHeartbeatAt) <= heartbeatTimeoutMs;
  }

  function getChildJobs(parentId) {
    return Array.from(store.jobs.values())
      .filter((job) => job.parent_job_id === parentId)
      .sort((left, right) => {
        const leftIndex = Number.isInteger(left.chunk_index) ? left.chunk_index : 0;
        const rightIndex = Number.isInteger(right.chunk_index) ? right.chunk_index : 0;
        return leftIndex - rightIndex;
      });
  }

  function getNodeJobs(nodeId) {
    return Array.from(store.jobs.values())
      .filter((job) => !job.is_parent)
      .filter((job) => job.node_id === nodeId)
      .filter((job) => ACTIVE_JOB_STATUSES.has(job.status))
      .sort((left, right) => getTimeMs(left.created_at) - getTimeMs(right.created_at));
  }

  function getNodeDerived(node, now = Date.now()) {
    const jobs = getNodeJobs(node.node_id);
    const fresh = isFresh(node, now);
    const runningJob = jobs.find((job) => job.status === JOB_STATUS.RUNNING) || jobs[0] || null;
    const currentAllocPercent = jobs.reduce(
      (total, job) => total + (Number(job.estimated_gpu_percent) || 0),
      0
    );
    const gpuList = pickGpuList(node.gpu);
    const totalVramMb =
      gpuList.reduce((max, gpu) => Math.max(max, Number(gpu?.memory_mb) || 0), 0) ||
      (Number(node.gpu?.memory_mb) || 0);
    const usedVramMb = gpuList.reduce((max, gpu) => Math.max(max, Number(gpu?.memory_used_mb) || 0), 0);
    const actualFreeVramMb = totalVramMb > 0 ? Math.max(0, totalVramMb - usedVramMb) : 0;
    const estimatedFreeVramMb =
      totalVramMb > 0 ? Math.max(0, Math.round(totalVramMb * (1 - currentAllocPercent / 100))) : 0;
    const freeVramMb = actualFreeVramMb || estimatedFreeVramMb;
    const utilizationPercent =
      gpuList.reduce((max, gpu) => Math.max(max, Number(gpu?.utilization_percent) || 0), 0) ||
      Math.min(currentAllocPercent, 100);
    const gpuName = gpuList[0]?.name || node.gpu?.name || null;
    const gpuAvailable = Boolean(node.gpu?.gpu_available);
    const lane = normalizeLane(node.lane, gpuAvailable ? inferLaneFromVram(totalVramMb) : JOB_LANES.LOW);
    const dockerReady = Boolean(node.allow_docker && node.docker?.docker_available);

    const status = fresh ? (jobs.length > 0 ? NODE_STATUS.BUSY : NODE_STATUS.IDLE) : NODE_STATUS.OFFLINE;

    return {
      fresh,
      status,
      current_alloc_percent: currentAllocPercent,
      current_queue_depth: jobs.length,
      utilization_percent: utilizationPercent,
      vram_mb: totalVramMb,
      free_vram_mb: freeVramMb,
      gpu_name: gpuName,
      gpu_available: gpuAvailable,
      docker_ready: dockerReady,
      lane,
      current_job_id: runningJob?.id || null,
    };
  }

  function toPublicNode(node, now = Date.now()) {
    const derived = getNodeDerived(node, now);
    const heartbeatAgeMs = Math.max(0, now - getTimeMs(node.lastHeartbeatAt));

    return clone({
      node_id: node.node_id,
      nodeId: node.node_id,
      workerId: node.node_id,
      workspace_id: node.workspace_id,
      name: node.name,
      hostname: node.hostname,
      lane: derived.lane,
      status: node.status || derived.status,
      online: derived.status !== NODE_STATUS.OFFLINE,
      connectivity: derived.status === NODE_STATUS.OFFLINE ? "offline" : "online",
      gpu_available: derived.gpu_available,
      gpu_name: derived.gpu_name,
      gpuSummary: summarizeGpu({
        gpu_available: derived.gpu_available,
        gpu_name: derived.gpu_name,
        vram_mb: derived.vram_mb,
      }),
      vram_mb: derived.vram_mb,
      free_vram_mb: derived.free_vram_mb,
      utilization_percent: derived.utilization_percent,
      docker_ready: derived.docker_ready,
      current_alloc_percent: derived.current_alloc_percent,
      max_alloc_percent: node.max_alloc_percent,
      current_queue_depth: derived.current_queue_depth,
      last_heartbeat: node.lastHeartbeatAt,
      lastHeartbeatAt: node.lastHeartbeatAt,
      heartbeat_age_ms: heartbeatAgeMs,
      heartbeat_timeout_ms: heartbeatTimeoutMs,
      heartbeat_fresh: derived.fresh,
      current_job_id: node.current_job_id || derived.current_job_id,
      currentJobId: node.current_job_id || derived.current_job_id,
      allow_docker: node.allow_docker,
      executorMode: node.executorMode,
      tags: safeClone(node.tags, []),
      platform: node.platform,
      arch: node.arch,
      osType: node.osType,
      agentVersion: node.agentVersion,
      cpu: safeClone(node.cpu, {}),
      ram: safeClone(node.ram, {}),
      gpu: safeClone(node.gpu, DEFAULT_GPU_INFO),
      docker: safeClone(node.docker, DEFAULT_DOCKER_INFO),
      registeredAt: node.registeredAt,
      last_status_change_at: node.last_status_change_at || node.registeredAt,
      offline_reason: node.offline_reason || null,
      isFresh: derived.fresh,
    });
  }

  function buildChunkProgress(job) {
    if (!job.is_parent) {
      return null;
    }

    const children = getChildJobs(job.id);
    const counts = {
      total: children.length,
      queued: 0,
      assigned: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    for (const child of children) {
      if (child.status === JOB_STATUS.RUNNING) {
        counts.running += 1;
      } else if (child.status === JOB_STATUS.COMPLETED) {
        counts.completed += 1;
      } else if (child.status === JOB_STATUS.FAILED) {
        counts.failed += 1;
      } else if (child.status === JOB_STATUS.ASSIGNED) {
        counts.assigned += 1;
      } else {
        counts.queued += 1;
      }
    }

    return {
      ...counts,
      pending: counts.queued + counts.assigned,
    };
  }

  function toPublicJob(job) {
    const chunkProgress = buildChunkProgress(job);

    return clone({
      id: job.id,
      job_id: job.id,
      jobId: job.id,
      workspace_id: job.workspace_id,
      status: job.status,
      image: job.image,
      command: job.command,
      command_args: clone(job.command_args || []),
      env: clone(job.env || {}),
      requires_gpu: Boolean(job.requires_gpu),
      lane_required: job.lane_required,
      estimated_gpu_percent: Number(job.estimated_gpu_percent) || 0,
      chunk_count: Number(job.chunk_count) || 1,
      parent_job_id: job.parent_job_id || null,
      chunk_index: Number.isInteger(job.chunk_index) ? job.chunk_index : null,
      chunk_total: Number(job.chunk_total || job.chunk_count || 1),
      logs: safeClone(job.logs, []),
      result: safeClone(job.result, null),
      error: job.error || job.result?.error || null,
      node_id: job.node_id || null,
      nodeId: job.node_id || null,
      assignedNodeId: job.node_id || null,
      created_at: job.created_at,
      createdAt: job.created_at,
      updated_at: job.updated_at,
      updatedAt: job.updated_at,
      delivered_at: job.delivered_at,
      deliveredAt: job.delivered_at,
      execution_mode: job.execution_mode,
      executionMode: job.execution_mode,
      resourceRequirements: safeClone(job.resourceRequirements, {}),
      metadata: safeClone(job.metadata, {}),
      is_parent: Boolean(job.is_parent),
      is_child: Boolean(job.parent_job_id),
      child_job_ids: safeClone(job.child_job_ids, []),
      child_count: Array.isArray(job.child_job_ids) ? job.child_job_ids.length : 0,
      chunk_progress: chunkProgress,
    });
  }

  function emitNodeEvent(eventType, node, reason, now = Date.now()) {
    emit(eventType, {
      node: toPublicNode(node, now),
      reason: reason || null,
    });
  }

  function emitJobEvent(eventType, job, node, reason) {
    emit(eventType, {
      job: toPublicJob(job),
      node: node ? toPublicNode(node) : null,
      reason: reason || null,
    });
  }

  function syncNodeState(node, options = {}) {
    const now = options.now || Date.now();
    const derived = getNodeDerived(node, now);
    const previousStatus = node.status || null;
    const previousJobId = node.current_job_id || null;
    const nextStatus = derived.status;
    const nextJobId = derived.current_job_id;
    const nextLane = derived.lane;
    const statusChanged = previousStatus !== nextStatus || previousJobId !== nextJobId || node.lane !== nextLane;

    node.status = nextStatus;
    node.current_job_id = nextJobId;
    node.lane = nextLane;

    if (nextStatus === NODE_STATUS.OFFLINE) {
      node.offline_reason = options.offlineReason || node.offline_reason || "heartbeat-timeout";
    } else {
      node.offline_reason = null;
    }

    if (statusChanged) {
      node.last_status_change_at = options.timestamp || nowIso();
      if (options.emit !== false) {
        emitNodeEvent(EVENT_TYPES.NODE_UPDATE, node, options.reason || "node-state-changed", now);
      }
    }

    return node;
  }

  function getOnboardingRecord(workerId) {
    return store.onboarding.get(workerId) || null;
  }

  function getOnboardingStatus(workerId) {
    const node = store.nodes.get(workerId);
    if (!node) {
      return "pending";
    }

    return node.status === NODE_STATUS.OFFLINE ? "offline" : "connected";
  }

  function toPublicOnboarding(record) {
    const node = store.nodes.get(record.workerId);

    return {
      workerId: record.workerId,
      workerName: record.workerName,
      nodeName: record.workerName,
      ownerName: record.ownerName,
      workspaceId: record.workspaceId,
      lane: record.lane,
      maxAllocPercent: record.maxAllocPercent,
      allowDocker: record.allowDocker,
      tags: safeClone(record.tags, []),
      backendUrl: record.backendUrl,
      status: getOnboardingStatus(record.workerId),
      nodeStatus: node ? toPublicNode(node).status : null,
      createdAt: record.createdAt,
      connectedAt: record.connectedAt,
    };
  }

  function listOnboardingNodes() {
    reconcileClusterState({ emitEvents: false });

    return Array.from(store.onboarding.values())
      .sort((left, right) => getTimeMs(right.createdAt) - getTimeMs(left.createdAt))
      .map(toPublicOnboarding);
  }

  function verifyWorkerToken(workerId, token) {
    if (!workerId) {
      return false;
    }

    const record = getOnboardingRecord(workerId);
    if (record?.workerToken && token === record.workerToken) {
      return true;
    }

    return Boolean(fallbackWorkerSecret && token && token === fallbackWorkerSecret);
  }

  function assertWorkerToken(workerId, token) {
    if (!verifyWorkerToken(workerId, token)) {
      throw new Error("Worker authorization failed");
    }
  }

  function getOnboardingEnvFile(workerId, token) {
    assertWorkerToken(workerId, token);
    const record = getOnboardingRecord(workerId);
    if (!record) {
      throw new Error("Onboarding record not found");
    }

    return {
      fileName: `campuscloud-${record.workerId}.env`,
      content: [
        "NODE_ENV=development",
        `BACKEND_URL=${record.backendUrl}`,
        `BACKEND_BASE_URL=${record.backendUrl}`,
        `WORKER_TOKEN=${record.workerToken}`,
        `BACKEND_API_KEY=${record.workerToken}`,
        "",
        `WORKSPACE_ID=${record.workspaceId}`,
        `WORKER_ID=${record.workerId}`,
        `NODE_NAME=${record.workerName}`,
        `WORKER_NAME=${record.workerName}`,
        `NODE_LANE=${record.lane}`,
        `MAX_ALLOC_PERCENT=${record.maxAllocPercent}`,
        `ALLOW_DOCKER=${record.allowDocker ? "true" : "false"}`,
        `WORKER_TAGS=${record.tags.join(",")}`,
        "",
        "HEARTBEAT_INTERVAL_MS=5000",
        "POLL_INTERVAL_MS=3000",
        "REQUEST_TIMEOUT_MS=10000",
        "",
        "EXECUTOR_MODE=local",
        "MOCK_JOB_DURATION_MS=6000",
        "MOCK_LOG_INTERVAL_MS=1000",
      ].join("\n"),
    };
  }

  function getOnboardingGuideFile(workerId, token) {
    assertWorkerToken(workerId, token);
    const record = getOnboardingRecord(workerId);
    if (!record) {
      throw new Error("Onboarding record not found");
    }

    return {
      fileName: `provider-setup-${record.workerId}.md`,
      content: [
        "# CampusCloud Provider Setup",
        "",
        "## Package values",
        `- Worker token: \`${record.workerToken}\``,
        `- Backend URL: \`${record.backendUrl}\``,
        `- Workspace ID: \`${record.workspaceId}\``,
        `- Node lane: \`${record.lane}\``,
        `- Node name: \`${record.workerName}\``,
        `- Max allocation percent: \`${record.maxAllocPercent}\``,
        "",
        "## Steps",
        "1. Copy the `agent/` folder to the provider machine.",
        "2. Put the generated `.env` file inside that folder.",
        "3. Open PowerShell in the agent folder.",
        "4. Run `npm install`.",
        "5. Run `npm start`.",
        "",
        "## Demo notes",
        "- Non-GPU machines can still join the workspace for local and chunked demo jobs.",
        "- Jobs with `requires_gpu=true` only match GPU-capable nodes in the same workspace and lane.",
        `- If the node misses heartbeats for more than ${Math.round(heartbeatTimeoutMs / 1000)} seconds, the backend marks it offline and fails its active jobs.`,
      ].join("\n"),
    };
  }

  function getOnboardingSetupScript(workerId, token) {
    const envFile = getOnboardingEnvFile(workerId, token);
    const escapedEnv = envFile.content.replace(/`/g, "``");

    return {
      fileName: `setup-${workerId}.ps1`,
      content: [
        "$ErrorActionPreference = 'Stop'",
        "$targetDir = Split-Path -Parent $MyInvocation.MyCommand.Path",
        '$envContent = @"',
        escapedEnv,
        '"@',
        'Set-Content -LiteralPath (Join-Path $targetDir ".env") -Value $envContent -Encoding UTF8',
        'Write-Host "Saved .env for CampusCloud agent."',
        'Write-Host "Next steps:"',
        'Write-Host "1. Open PowerShell in this folder."',
        'Write-Host "2. Run npm install"',
        'Write-Host "3. Run npm start"',
      ].join("\n"),
    };
  }

  function createOnboardingNode(payload = {}) {
    const workerName = String(
      payload.worker_name || payload.workerName || payload.node_name || "Workspace Provider"
    ).trim();
    const ownerName = String(payload.owner_name || payload.ownerName || "").trim();
    const tags = normalizeTags(payload.tags || payload.worker_tags || ["windows", "hackathon"]);
    const workspaceId = normalizeWorkspaceId(payload.workspace_id || payload.workspaceId, defaultWorkspaceId);
    const lane = normalizeLane(payload.node_lane || payload.lane, JOB_LANES.LOW);
    const maxAllocPercent = clampNumber(
      payload.max_alloc_percent || payload.maxAllocPercent,
      1,
      100,
      defaultMaxAllocPercent
    );
    const allowDocker = parseBoolean(payload.allow_docker ?? payload.allowDocker, true);
    const baseWorkerId = slugify(payload.worker_id || payload.workerId || workerName) || "workspace-node";

    let workerId = baseWorkerId;
    let suffix = 1;
    while (store.onboarding.has(workerId) || store.nodes.has(workerId)) {
      suffix += 1;
      workerId = `${baseWorkerId}-${suffix}`;
    }

    const workerToken = createWorkerToken();
    const record = {
      workerId,
      workerName,
      ownerName,
      workspaceId,
      lane,
      maxAllocPercent,
      allowDocker,
      tags,
      workerToken,
      backendUrl: backendPublicUrl,
      createdAt: nowIso(),
      connectedAt: null,
    };

    store.onboarding.set(workerId, record);

    return {
      ...toPublicOnboarding(record),
      workerToken,
      backendUrl: record.backendUrl,
      workspaceId: record.workspaceId,
      lane: record.lane,
      nodeName: record.workerName,
      maxAllocPercent: record.maxAllocPercent,
      envFile: getOnboardingEnvFile(workerId, workerToken),
      setupScript: getOnboardingSetupScript(workerId, workerToken),
      setupGuide: getOnboardingGuideFile(workerId, workerToken),
      startCommand: "npm install && npm start",
    };
  }

  function appendLogsToJob(job, entries, prefix = "") {
    if (!entries.length) {
      return;
    }

    job.logs.push(
      ...entries.map((entry) => ({
        ...entry,
        text: prefix ? `${prefix}${entry.text}` : entry.text,
      }))
    );

    if (job.logs.length > maxLogsPerJob) {
      job.logs.splice(0, job.logs.length - maxLogsPerJob);
    }
  }

  function buildParentResult(children, progress, status) {
    return {
      status,
      child_count: children.length,
      completed_child_count: progress.completed,
      failed_child_count: progress.failed,
      child_results: children.map((child) => ({
        job_id: child.id,
        chunk_index: child.chunk_index,
        status: child.status,
        node_id: child.node_id || null,
        result: safeClone(child.result, null),
      })),
    };
  }

  function syncParentJob(parentId, shouldEmit = true) {
    if (!parentId) {
      return null;
    }

    const parent = store.jobs.get(parentId);
    if (!parent || !parent.is_parent) {
      return null;
    }

    const previousStatus = parent.status;
    const previousChildCount = Array.isArray(parent.child_job_ids) ? parent.child_job_ids.length : 0;
    const previousError = parent.error || null;
    const previousResultJson = JSON.stringify(parent.result ?? null);
    const children = getChildJobs(parentId);
    const progress = buildChunkProgress(parent);
    parent.child_job_ids = children.map((child) => child.id);
    parent.updated_at = nowIso();

    if (progress.failed > 0) {
      parent.status = JOB_STATUS.FAILED;
      parent.error = "One or more chunks failed";
      parent.result = buildParentResult(children, progress, parent.status);
    } else if (progress.completed === progress.total && progress.total > 0) {
      parent.status = JOB_STATUS.COMPLETED;
      parent.error = null;
      parent.result = buildParentResult(children, progress, parent.status);
    } else if (progress.running > 0 || progress.completed > 0) {
      parent.status = JOB_STATUS.RUNNING;
      parent.error = null;
      parent.result = null;
    } else if (progress.assigned > 0) {
      parent.status = JOB_STATUS.ASSIGNED;
      parent.error = null;
    } else {
      parent.status = JOB_STATUS.QUEUED;
      parent.error = null;
      parent.result = null;
    }

    const shouldBroadcast =
      previousStatus !== parent.status ||
      previousChildCount !== parent.child_job_ids.length ||
      previousError !== (parent.error || null) ||
      previousResultJson !== JSON.stringify(parent.result ?? null);

    if (shouldEmit && shouldBroadcast) {
      emitJobEvent(EVENT_TYPES.JOB_UPDATE, parent, null, "parent-sync");
      if (parent.status !== previousStatus && parent.status === JOB_STATUS.COMPLETED) {
        emitJobEvent(EVENT_TYPES.JOB_COMPLETE, parent, null, "parent-completed");
      } else if (parent.status !== previousStatus && parent.status === JOB_STATUS.FAILED) {
        emitJobEvent(EVENT_TYPES.JOB_FAILED, parent, null, "parent-failed");
      }
    }

    return parent;
  }

  function createCanonicalJob(payload = {}, overrides = {}) {
    const image = String(overrides.image ?? payload.image ?? "").trim();
    if (!image) {
      throw new Error("image is required");
    }

    const workspaceId = normalizeWorkspaceId(
      overrides.workspace_id ?? payload.workspace_id ?? payload.workspaceId,
      defaultWorkspaceId
    );
    const commandArgs = normalizeCommand(overrides.command ?? payload.command ?? DEFAULT_COMMAND);
    const normalizedCommandArgs = commandArgs.length ? commandArgs : clone(DEFAULT_COMMAND);
    const rawChunkCount = Number(overrides.chunk_count ?? payload.chunk_count ?? payload.chunkCount ?? 1);
    const chunkCount = Math.max(1, Math.floor(rawChunkCount) || 1);
    const requiresGpu = parseBoolean(
      overrides.requires_gpu ?? payload.requires_gpu ?? payload.resource_requirements?.gpu_required,
      false
    );
    const laneRequired = normalizeLane(
      overrides.lane_required ?? payload.lane_required ?? payload.laneRequired,
      null
    );
    const estimatedGpuPercent = clampNumber(
      overrides.estimated_gpu_percent ?? payload.estimated_gpu_percent ?? payload.estimatedGpuPercent,
      0,
      100,
      requiresGpu ? 25 : 0
    );
    const executionMode = normalizeExecutionMode(
      overrides.execution_mode ?? payload.execution_mode,
      EXECUTION_MODE.LOCAL
    );
    const resourceRequirements = normalizeResourceRequirements(
      payload.resource_requirements || {},
      {
        gpu_required: requiresGpu,
        min_gpu_memory_mb: laneRequired === JOB_LANES.HIGH ? 20000 : laneRequired === JOB_LANES.MID ? 10000 : 0,
      }
    );

    return {
      id: overrides.id || payload.job_id || payload.jobId || randomUUID(),
      workspace_id: workspaceId,
      status: overrides.status || JOB_STATUS.QUEUED,
      image,
      command: overrides.command_text || stringifyCommand(normalizedCommandArgs),
      command_args: clone(normalizedCommandArgs),
      env: payload.env && typeof payload.env === "object" && !Array.isArray(payload.env) ? clone(payload.env) : {},
      requires_gpu: requiresGpu,
      lane_required: laneRequired,
      estimated_gpu_percent: estimatedGpuPercent,
      chunk_count: chunkCount,
      parent_job_id: overrides.parent_job_id || null,
      chunk_index: Number.isInteger(overrides.chunk_index) ? overrides.chunk_index : null,
      chunk_total: Number(overrides.chunk_total || chunkCount || 1),
      logs: [],
      result: null,
      error: null,
      node_id: null,
      created_at: overrides.created_at || nowIso(),
      updated_at: overrides.updated_at || nowIso(),
      delivered_at: null,
      delivery_status: "pending",
      submitted_by: payload.submitted_by || "dashboard",
      execution_mode: executionMode,
      executionMode: executionMode,
      resourceRequirements,
      metadata: payload.metadata && typeof payload.metadata === "object" ? clone(payload.metadata) : {},
      is_parent: Boolean(overrides.is_parent),
      child_job_ids: safeClone(overrides.child_job_ids, []),
    };
  }

  function emitJobSubmit(job) {
    emit(EVENT_TYPES.JOB_SUBMIT, { job: toPublicJob(job) });
  }

  function createJob(payload = {}) {
    const chunkCount = Math.max(1, Math.floor(Number(payload.chunk_count ?? payload.chunkCount ?? 1) || 1));

    if (chunkCount <= 1) {
      const job = createCanonicalJob(payload);
      if (store.jobs.has(job.id)) {
        throw new Error(`Job ${job.id} already exists`);
      }

      store.jobs.set(job.id, job);
      store.queue.enqueue(job.id);
      emitJobSubmit(job);
      assignQueuedJobs();
      return {
        job: toPublicJob(job),
        children: [],
      };
    }

    const parent = createCanonicalJob(payload, {
      id: payload.job_id || payload.jobId || randomUUID(),
      is_parent: true,
      status: JOB_STATUS.QUEUED,
      child_job_ids: [],
    });

    if (store.jobs.has(parent.id)) {
      throw new Error(`Job ${parent.id} already exists`);
    }

    store.jobs.set(parent.id, parent);
    emitJobSubmit(parent);

    const children = [];
    for (let index = 1; index <= chunkCount; index += 1) {
      const childId = `${parent.id}-chunk-${index}`;
      const child = createCanonicalJob(payload, {
        id: store.jobs.has(childId) ? `${childId}-${randomUUID().slice(0, 8)}` : childId,
        parent_job_id: parent.id,
        chunk_index: index,
        chunk_total: chunkCount,
        chunk_count: 1,
        status: JOB_STATUS.QUEUED,
      });

      store.jobs.set(child.id, child);
      store.queue.enqueue(child.id);
      parent.child_job_ids.push(child.id);
      children.push(child);
      emitJobSubmit(child);
    }

    syncParentJob(parent.id, true);
    assignQueuedJobs();

    return {
      job: toPublicJob(parent),
      children: children.map(toPublicJob),
    };
  }

  function getBestNodeForJob(job) {
    return (
      Array.from(store.nodes.values())
        .map((node) => ({ node, derived: getNodeDerived(node) }))
        .filter(({ node }) => node.status !== NODE_STATUS.OFFLINE)
        .filter(({ node }) => node.workspace_id === job.workspace_id)
        .filter(({ derived }) => !job.lane_required || derived.lane === job.lane_required)
        .filter(({ derived }) => !job.requires_gpu || derived.gpu_available)
        .filter(({ node, derived }) => derived.current_alloc_percent + job.estimated_gpu_percent <= node.max_alloc_percent)
        .sort((left, right) => {
          const idleDelta = (left.node.status === NODE_STATUS.IDLE ? 0 : 1) - (right.node.status === NODE_STATUS.IDLE ? 0 : 1);
          if (idleDelta !== 0) {
            return idleDelta;
          }

          const queueDepthDelta = left.derived.current_queue_depth - right.derived.current_queue_depth;
          if (queueDepthDelta !== 0) {
            return queueDepthDelta;
          }

          const utilizationDelta = left.derived.utilization_percent - right.derived.utilization_percent;
          if (utilizationDelta !== 0) {
            return utilizationDelta;
          }

          const heartbeatDelta = getTimeMs(right.node.lastHeartbeatAt) - getTimeMs(left.node.lastHeartbeatAt);
          if (heartbeatDelta !== 0) {
            return heartbeatDelta;
          }

          return String(left.node.node_id).localeCompare(String(right.node.node_id));
        })[0]?.node || null
    );
  }

  function failActiveJobsForNode(node, reason) {
    const impactedJobs = getNodeJobs(node.node_id);

    for (const job of impactedJobs) {
      if (JOB_TERMINAL_STATUSES.has(job.status)) {
        continue;
      }

      job.status = JOB_STATUS.FAILED;
      job.updated_at = nowIso();
      job.delivery_status = "complete";
      job.error = reason;
      job.result = {
        ...(job.result || {}),
        error: reason,
        failed_by: "node-offline",
        node_id: node.node_id,
      };

      emitJobEvent(EVENT_TYPES.JOB_UPDATE, job, node, "node-offline");
      emitJobEvent(EVENT_TYPES.JOB_FAILED, job, node, "node-offline");
      syncParentJob(job.parent_job_id, true);
    }
  }

  function reconcileClusterState(options = {}) {
    const now = options.now || Date.now();
    const emitEvents = options.emitEvents !== false;

    for (const node of store.nodes.values()) {
      const wasOnline = node.status !== NODE_STATUS.OFFLINE;
      const fresh = isFresh(node, now);

      if (!fresh && wasOnline) {
        failActiveJobsForNode(node, `Node ${node.node_id} missed heartbeat timeout and was marked offline`);
      }

      syncNodeState(node, {
        now,
        emit: emitEvents,
        reason: fresh ? "node-health-refresh" : "node-heartbeat-timeout",
        offlineReason: fresh ? null : "heartbeat-timeout",
      });
    }

    for (const job of store.jobs.values()) {
      if (job.is_parent) {
        syncParentJob(job.id, emitEvents);
      }
    }
  }

  function assignQueuedJobs() {
    reconcileClusterState({ emitEvents: true });

    for (const jobId of store.queue.snapshot()) {
      const job = store.jobs.get(jobId);
      if (!job || job.is_parent || job.status !== JOB_STATUS.QUEUED) {
        store.queue.remove(jobId);
        continue;
      }

      const node = getBestNodeForJob(job);
      if (!node) {
        continue;
      }

      job.status = JOB_STATUS.ASSIGNED;
      job.node_id = node.node_id;
      job.delivery_status = "pending";
      job.updated_at = nowIso();
      store.queue.remove(jobId);

      syncNodeState(node, {
        emit: true,
        reason: "job-assigned",
      });

      emitJobEvent(EVENT_TYPES.JOB_ASSIGN, job, node, "scheduler-assigned");
      syncParentJob(job.parent_job_id, true);
    }
  }

  function registerNode(payload = {}) {
    const nodeId = payload.worker_id || payload.node_id;
    if (!nodeId) {
      throw new Error("worker_id is required");
    }

    const current = store.nodes.get(nodeId);
    const onboardingRecord = getOnboardingRecord(nodeId);
    const gpu = safeClone(payload.gpu || current?.gpu || DEFAULT_GPU_INFO, DEFAULT_GPU_INFO);
    const gpuList = pickGpuList(gpu);
    const inferredLane = gpu.gpu_available
      ? inferLaneFromVram(gpuList.reduce((max, item) => Math.max(max, Number(item?.memory_mb) || 0), 0))
      : JOB_LANES.LOW;
    const timestamp = nowIso();

    const node = {
      node_id: nodeId,
      workspace_id: normalizeWorkspaceId(
        payload.workspace_id || onboardingRecord?.workspaceId || current?.workspace_id,
        defaultWorkspaceId
      ),
      name: String(payload.node_name || payload.worker_name || current?.name || payload.hostname || nodeId).trim(),
      hostname: payload.hostname || current?.hostname || nodeId,
      lane: normalizeLane(payload.node_lane || payload.lane || onboardingRecord?.lane || current?.lane, inferredLane),
      status: current?.status || NODE_STATUS.IDLE,
      current_job_id: current?.current_job_id || null,
      max_alloc_percent: clampNumber(
        payload.max_alloc_percent || onboardingRecord?.maxAllocPercent || current?.max_alloc_percent,
        1,
        100,
        defaultMaxAllocPercent
      ),
      allow_docker: parseBoolean(
        payload.allow_docker ?? onboardingRecord?.allowDocker ?? current?.allow_docker,
        true
      ),
      executorMode: normalizeExecutionMode(payload.executor_mode, current?.executorMode || EXECUTION_MODE.LOCAL),
      tags: normalizeTags(payload.tags || onboardingRecord?.tags || current?.tags),
      platform: payload.platform || current?.platform || "",
      arch: payload.arch || current?.arch || "",
      osType: payload.os_type || current?.osType || "",
      agentVersion: payload.agent_version || current?.agentVersion || "",
      cpu: safeClone(payload.cpu || current?.cpu || {}, {}),
      ram: safeClone(payload.ram || current?.ram || {}, {}),
      gpu,
      docker: safeClone(payload.docker || current?.docker || DEFAULT_DOCKER_INFO, DEFAULT_DOCKER_INFO),
      registeredAt: current?.registeredAt || timestamp,
      lastHeartbeatAt: timestamp,
      last_status_change_at: current?.last_status_change_at || timestamp,
      offline_reason: null,
    };

    store.nodes.set(nodeId, node);
    syncNodeState(node, {
      emit: false,
      reason: "register",
      timestamp,
    });

    if (onboardingRecord) {
      onboardingRecord.connectedAt = timestamp;
    }

    emitNodeEvent(EVENT_TYPES.AGENT_REGISTER, node, "register");
    assignQueuedJobs();
    return toPublicNode(node);
  }

  function heartbeat(payload = {}) {
    const nodeId = payload.worker_id || payload.node_id;
    const node = store.nodes.get(nodeId);
    if (!node) {
      throw new Error("Worker not registered");
    }

    node.lastHeartbeatAt = payload.timestamp || nowIso();
    if (payload.node_lane) {
      node.lane = normalizeLane(payload.node_lane, node.lane);
    }
    if (payload.workspace_id) {
      node.workspace_id = normalizeWorkspaceId(payload.workspace_id, node.workspace_id);
    }

    syncNodeState(node, {
      emit: false,
      reason: "heartbeat",
      timestamp: node.lastHeartbeatAt,
    });

    emitNodeEvent(EVENT_TYPES.AGENT_HEARTBEAT, node, "heartbeat");

    if (node.status === NODE_STATUS.IDLE) {
      assignQueuedJobs();
    }

    return toPublicNode(node);
  }

  function listNodes() {
    reconcileClusterState({ emitEvents: false });

    return Array.from(store.nodes.values())
      .sort((left, right) => getTimeMs(right.lastHeartbeatAt) - getTimeMs(left.lastHeartbeatAt))
      .map(toPublicNode);
  }

  function listJobs() {
    reconcileClusterState({ emitEvents: false });

    return Array.from(store.jobs.values())
      .sort((left, right) => getTimeMs(right.created_at) - getTimeMs(left.created_at))
      .map(toPublicJob);
  }

  function getJob(jobId) {
    reconcileClusterState({ emitEvents: false });
    const job = store.jobs.get(jobId);
    return job ? toPublicJob(job) : null;
  }

  function pollNextJob(nodeId) {
    reconcileClusterState({ emitEvents: false });
    const node = store.nodes.get(nodeId);
    if (!node) {
      throw new Error("Worker not registered");
    }

    if (node.status === NODE_STATUS.OFFLINE) {
      return null;
    }

    const job = Array.from(store.jobs.values())
      .filter((item) => !item.is_parent)
      .filter((item) => item.node_id === nodeId)
      .filter((item) => item.status === JOB_STATUS.ASSIGNED)
      .filter((item) => item.delivery_status !== "delivered")
      .sort((left, right) => getTimeMs(left.created_at) - getTimeMs(right.created_at))[0];

    if (!job) {
      return null;
    }

    job.delivery_status = "delivered";
    job.delivered_at = nowIso();
    job.updated_at = nowIso();

    return buildAgentJobPayload(job);
  }

  function assertValidJobStatusTransition(currentStatus, nextStatus) {
    const allowedTransitions = {
      [JOB_STATUS.QUEUED]: new Set([JOB_STATUS.ASSIGNED, JOB_STATUS.FAILED]),
      [JOB_STATUS.ASSIGNED]: new Set([JOB_STATUS.RUNNING, JOB_STATUS.FAILED]),
      [JOB_STATUS.RUNNING]: new Set([JOB_STATUS.COMPLETED, JOB_STATUS.FAILED]),
      [JOB_STATUS.COMPLETED]: new Set(),
      [JOB_STATUS.FAILED]: new Set(),
    };

    if (currentStatus === nextStatus) {
      return;
    }

    if (!allowedTransitions[currentStatus]?.has(nextStatus)) {
      throw new Error(`Invalid job transition: ${currentStatus} -> ${nextStatus}`);
    }
  }

  function updateJobStatus(jobId, payload = {}) {
    const job = store.jobs.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.is_parent) {
      throw new Error("Parent job status is derived from child jobs");
    }

    if (!payload.status) {
      throw new Error("status is required");
    }

    if (!Object.values(JOB_STATUS).includes(payload.status)) {
      throw new Error(`Unsupported status: ${payload.status}`);
    }

    assertValidJobStatusTransition(job.status, payload.status);

    if (payload.worker_id && job.node_id && job.node_id !== payload.worker_id) {
      throw new Error("Job is assigned to a different worker");
    }

    const previousStatus = job.status;
    job.status = payload.status;
    job.updated_at = payload.timestamp || nowIso();
    job.node_id = payload.worker_id || job.node_id || null;
    if (JOB_TERMINAL_STATUSES.has(payload.status)) {
      job.delivery_status = "complete";
    }
    if (payload.error) {
      job.error = String(payload.error);
    } else if (payload.status === JOB_STATUS.COMPLETED) {
      job.error = null;
    }

    const node = job.node_id ? store.nodes.get(job.node_id) : null;
    if (node) {
      syncNodeState(node, {
        emit: true,
        reason: `job-${payload.status}`,
        timestamp: job.updated_at,
      });
    }

    emitJobEvent(EVENT_TYPES.JOB_UPDATE, job, node, "worker-status-update");

    if (payload.status === JOB_STATUS.COMPLETED && previousStatus !== JOB_STATUS.COMPLETED) {
      emitJobEvent(EVENT_TYPES.JOB_COMPLETE, job, node, "worker-completed");
    }

    if (payload.status === JOB_STATUS.FAILED && previousStatus !== JOB_STATUS.FAILED) {
      emitJobEvent(EVENT_TYPES.JOB_FAILED, job, node, "worker-failed");
    }

    syncParentJob(job.parent_job_id, true);
    assignQueuedJobs();
    return toPublicJob(job);
  }

  function appendJobLogs(jobId, logs) {
    const job = store.jobs.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const entries = parseLogs(logs);
    if (!entries.length) {
      return toPublicJob(job);
    }

    appendLogsToJob(job, entries);
    job.updated_at = nowIso();

    const parent = job.parent_job_id ? store.jobs.get(job.parent_job_id) : null;
    if (parent) {
      appendLogsToJob(parent, entries, `[chunk ${job.chunk_index}/${job.chunk_total}] `);
      parent.updated_at = job.updated_at;
      emitJobEvent(EVENT_TYPES.JOB_UPDATE, parent, null, "parent-log-update");
    }

    emit(EVENT_TYPES.JOB_LOG, {
      jobId: job.id,
      nodeId: job.node_id,
      logs: clone(entries),
    });

    return toPublicJob(job);
  }

  function setJobResult(jobId, result = {}) {
    const job = store.jobs.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    job.result = safeClone(result, {});
    job.updated_at = nowIso();
    if (result?.error) {
      job.error = String(result.error);
    }

    emitJobEvent(EVENT_TYPES.JOB_UPDATE, job, job.node_id ? store.nodes.get(job.node_id) : null, "job-result");
    syncParentJob(job.parent_job_id, true);
    return toPublicJob(job);
  }

  function runMaintenanceSweep() {
    assignQueuedJobs();
  }

  return {
    events,
    assignQueuedJobs,
    runMaintenanceSweep,
    reconcileClusterState,
    listNodes,
    listOnboardingNodes,
    createOnboardingNode,
    getOnboardingEnvFile,
    getOnboardingSetupGuide: getOnboardingGuideFile,
    getOnboardingSetupScript,
    verifyWorkerToken,
    registerNode,
    heartbeat,
    listJobs,
    createJob,
    getJob,
    pollNextJob,
    updateJobStatus,
    appendJobLogs,
    setJobResult,
  };
}

module.exports = {
  createOrchestratorService,
};
