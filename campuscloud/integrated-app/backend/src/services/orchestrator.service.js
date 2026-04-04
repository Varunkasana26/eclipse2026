const { EventEmitter } = require("events");
const { randomUUID } = require("crypto");
const { createStore } = require("../models/store");

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map((tag) => String(tag).trim()).filter(Boolean);
}

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

function summarizeGpu(node) {
  const gpus = Array.isArray(node?.gpu?.gpus) ? node.gpu.gpus : [];
  if (!node?.gpu?.gpu_available || gpus.length === 0) {
    return "No GPU";
  }

  return gpus
    .map((gpu) => `${gpu.name} ${Number(((gpu.memory_mb || 0) / 1024).toFixed(0))}GB`)
    .join(", ");
}

function createOrchestratorService(options = {}) {
  const store = createStore();
  const events = new EventEmitter();
  const heartbeatTimeoutMs = Number(options.heartbeatTimeoutMs) || 15000;
  const maxLogsPerJob = Number(options.maxLogsPerJob) || 500;

  function emit(event, payload) {
    events.emit("message", {
      event,
      payload,
      ts: nowIso(),
    });
  }

  function isFresh(node) {
    return Date.now() - new Date(node.lastHeartbeatAt).getTime() <= heartbeatTimeoutMs;
  }

  function toPublicNode(node) {
    const fresh = isFresh(node);
    return {
      nodeId: node.nodeId,
      workerId: node.nodeId,
      name: node.name,
      hostname: node.hostname,
      status: fresh ? node.status : "offline",
      executorMode: node.executorMode,
      tags: clone(node.tags),
      platform: node.platform,
      arch: node.arch,
      osType: node.osType,
      agentVersion: node.agentVersion,
      cpu: clone(node.cpu),
      ram: clone(node.ram),
      gpu: clone(node.gpu),
      docker: clone(node.docker),
      gpuSummary: summarizeGpu(node),
      currentJobId: node.currentJobId,
      registeredAt: node.registeredAt,
      lastHeartbeatAt: node.lastHeartbeatAt,
      isFresh: fresh,
    };
  }

  function toPublicJob(job) {
    return clone({
      id: job.id,
      jobId: job.id,
      status: job.status,
      assignedNodeId: job.assignedNodeId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      deliveredAt: job.deliveredAt,
      submittedBy: job.submittedBy,
      image: job.image,
      command: job.command,
      env: job.env,
      executionMode: job.executionMode,
      resourceRequirements: job.resourceRequirements,
      logs: job.logs,
      result: job.result,
      metadata: job.metadata,
    });
  }

  function getBestNodeForJob(job) {
    return Array.from(store.nodes.values())
      .filter((node) => node.status === "idle")
      .filter((node) => isFresh(node))
      .filter((node) => {
        if (!job.resourceRequirements.gpu_required) {
          return true;
        }
        return node?.gpu?.gpu_available === true;
      })
      .filter((node) => {
        if (!job.resourceRequirements.gpu_count) {
          return true;
        }
        return (Number(node?.gpu?.gpu_count) || 0) >= job.resourceRequirements.gpu_count;
      })
      .filter((node) => {
        if (!job.resourceRequirements.min_gpu_memory_mb) {
          return true;
        }

        const maxGpuMemory = (Array.isArray(node?.gpu?.gpus) ? node.gpu.gpus : []).reduce(
          (max, gpu) => Math.max(max, Number(gpu?.memory_mb) || 0),
          0
        );
        return maxGpuMemory >= job.resourceRequirements.min_gpu_memory_mb;
      })
      .filter((node) => {
        if (!job.resourceRequirements.min_ram_mb) {
          return true;
        }
        return (Number(node?.ram?.total_mb) || 0) >= job.resourceRequirements.min_ram_mb;
      })
      .filter((node) => {
        if (!job.resourceRequirements.required_tags.length) {
          return true;
        }
        return job.resourceRequirements.required_tags.every((tag) => node.tags.includes(tag));
      })
      .sort((left, right) => (Number(right?.ram?.free_mb) || 0) - (Number(left?.ram?.free_mb) || 0))[0] || null;
  }

  function assignQueuedJobs() {
    for (const jobId of store.queue.snapshot()) {
      const job = store.jobs.get(jobId);
      if (!job || job.status !== "queued") {
        store.queue.remove(jobId);
        continue;
      }

      const node = getBestNodeForJob(job);
      if (!node) {
        continue;
      }

      node.status = "busy";
      node.currentJobId = job.id;
      node.updatedAt = nowIso();

      job.status = "assigned";
      job.assignedNodeId = node.nodeId;
      job.deliveryStatus = "pending";
      job.updatedAt = nowIso();

      store.queue.remove(jobId);

      emit("job:assign", {
        job: toPublicJob(job),
        node: toPublicNode(node),
      });
    }
  }

  function registerNode(payload = {}) {
    const nodeId = payload.worker_id || payload.node_id;
    if (!nodeId) {
      throw new Error("worker_id is required");
    }

    const current = store.nodes.get(nodeId);
    const node = {
      nodeId,
      name: payload.worker_name || payload.hostname || nodeId,
      hostname: payload.hostname || nodeId,
      status: payload.status || current?.status || "idle",
      executorMode: payload.executor_mode || current?.executorMode || "local",
      tags: normalizeTags(payload.tags || current?.tags),
      platform: payload.platform || current?.platform || "",
      arch: payload.arch || current?.arch || "",
      osType: payload.os_type || current?.osType || "",
      agentVersion: payload.agent_version || current?.agentVersion || "",
      cpu: clone(payload.cpu || current?.cpu || {}),
      ram: clone(payload.ram || current?.ram || {}),
      gpu: clone(payload.gpu || current?.gpu || { gpu_available: false, gpu_count: 0, gpus: [] }),
      docker: clone(payload.docker || current?.docker || { docker_available: false, docker_version: null }),
      currentJobId: current?.currentJobId || null,
      registeredAt: current?.registeredAt || nowIso(),
      lastHeartbeatAt: nowIso(),
      updatedAt: nowIso(),
    };

    store.nodes.set(nodeId, node);
    emit("agent:register", { node: toPublicNode(node) });
    assignQueuedJobs();
    return toPublicNode(node);
  }

  function heartbeat(payload = {}) {
    const nodeId = payload.worker_id || payload.node_id;
    const node = store.nodes.get(nodeId);
    if (!node) {
      throw new Error("Worker not registered");
    }

    node.status = payload.status || node.status;
    node.currentJobId =
      payload.current_job_id === undefined ? node.currentJobId : payload.current_job_id;
    node.lastHeartbeatAt = payload.timestamp || nowIso();
    node.updatedAt = nowIso();

    emit("agent:heartbeat", { node: toPublicNode(node) });

    if (node.status === "idle" && !node.currentJobId) {
      assignQueuedJobs();
    }

    return toPublicNode(node);
  }

  function listNodes() {
    return Array.from(store.nodes.values()).map(toPublicNode);
  }

  function createJob(payload = {}) {
    const id = payload.job_id || payload.jobId || randomUUID();
    if (store.jobs.has(id)) {
      throw new Error(`Job ${id} already exists`);
    }

    const job = {
      id,
      status: "queued",
      assignedNodeId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deliveredAt: null,
      deliveryStatus: "pending",
      submittedBy: payload.submitted_by || "dashboard",
      image: payload.image || "node:20-alpine",
      command: Array.isArray(payload.command) ? payload.command.map((item) => String(item)) : [],
      env: payload.env && typeof payload.env === "object" ? clone(payload.env) : {},
      executionMode: payload.execution_mode || "local",
      resourceRequirements: {
        gpu_required: Boolean(payload.resource_requirements?.gpu_required),
        gpu_count: Number(payload.resource_requirements?.gpu_count) || 0,
        min_gpu_memory_mb: Number(payload.resource_requirements?.min_gpu_memory_mb) || 0,
        min_ram_mb: Number(payload.resource_requirements?.min_ram_mb) || 0,
        required_tags: normalizeTags(payload.resource_requirements?.required_tags),
      },
      metadata: payload.metadata && typeof payload.metadata === "object" ? clone(payload.metadata) : {},
      logs: [],
      result: null,
    };

    store.jobs.set(job.id, job);
    store.queue.enqueue(job.id);
    emit("job:submit", { job: toPublicJob(job) });
    assignQueuedJobs();
    return toPublicJob(job);
  }

  function listJobs() {
    return Array.from(store.jobs.values())
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map(toPublicJob);
  }

  function getJob(jobId) {
    const job = store.jobs.get(jobId);
    return job ? toPublicJob(job) : null;
  }

  function pollNextJob(nodeId) {
    const node = store.nodes.get(nodeId);
    if (!node) {
      throw new Error("Worker not registered");
    }

    const job = Array.from(store.jobs.values()).find(
      (item) =>
        item.assignedNodeId === nodeId &&
        item.status === "assigned" &&
        item.deliveryStatus !== "delivered"
    );

    if (!job) {
      return null;
    }

    job.deliveryStatus = "delivered";
    job.deliveredAt = nowIso();
    job.updatedAt = nowIso();

    return clone({
      job_id: job.id,
      image: job.image,
      command: job.command,
      env: job.env,
      execution_mode: job.executionMode,
      timeout_ms: job.metadata.timeout_ms || 300000,
      resource_requirements: job.resourceRequirements,
      metadata: job.metadata,
    });
  }

  function updateJobStatus(jobId, payload = {}) {
    const job = store.jobs.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (!payload.status) {
      throw new Error("status is required");
    }

    job.status = payload.status;
    job.updatedAt = payload.timestamp || nowIso();
    if (payload.worker_id) {
      job.assignedNodeId = payload.worker_id;
    }

    const node = job.assignedNodeId ? store.nodes.get(job.assignedNodeId) : null;
    if (node) {
      if (payload.status === "running" || payload.status === "assigned") {
        node.status = "busy";
        node.currentJobId = job.id;
      } else if (payload.status === "completed" || payload.status === "failed") {
        node.status = "idle";
        node.currentJobId = null;
      }

      node.lastHeartbeatAt = payload.timestamp || nowIso();
      node.updatedAt = nowIso();
    }

    emit("job:update", { job: toPublicJob(job) });

    if (payload.status === "completed") {
      emit("job:complete", { job: toPublicJob(job) });
    }

    if (payload.status === "failed") {
      emit("job:failed", { job: toPublicJob(job) });
    }

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

    job.logs.push(...entries);
    if (job.logs.length > maxLogsPerJob) {
      job.logs.splice(0, job.logs.length - maxLogsPerJob);
    }
    job.updatedAt = nowIso();

    emit("job:log", {
      jobId: job.id,
      nodeId: job.assignedNodeId,
      logs: clone(entries),
    });

    return toPublicJob(job);
  }

  function setJobResult(jobId, result = {}) {
    const job = store.jobs.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    job.result = clone(result);
    job.updatedAt = nowIso();
    return toPublicJob(job);
  }

  return {
    events,
    assignQueuedJobs,
    listNodes,
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
