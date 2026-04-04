import express from "express";

const workers = new Map();

function getMaxGpuMemoryMb(worker) {
  const gpus = Array.isArray(worker?.gpu?.gpus) ? worker.gpu.gpus : [];
  return gpus.reduce((max, gpu) => Math.max(max, Number(gpu.memory_mb) || 0), 0);
}

function hasFreshHeartbeat(worker) {
  const lastHeartbeatAt = worker?.last_heartbeat_at ? new Date(worker.last_heartbeat_at).getTime() : 0;
  return Date.now() - lastHeartbeatAt <= 30000;
}

function hasRequiredTags(worker, requiredTags) {
  if (!Array.isArray(requiredTags) || requiredTags.length === 0) {
    return true;
  }

  const tags = Array.isArray(worker.tags) ? worker.tags : [];
  return requiredTags.every((tag) => tags.includes(tag));
}

function findWorkerForJob(job, workerList) {
  const resourceRequirements = job?.resource_requirements || {};

  const candidates = workerList
    .filter((worker) => worker.status === "idle")
    .filter((worker) => hasFreshHeartbeat(worker))
    .filter((worker) => {
      if (!resourceRequirements.gpu_required) {
        return true;
      }

      if (worker?.gpu?.gpu_available !== true) {
        return false;
      }

      if (
        resourceRequirements.min_gpu_memory_mb &&
        getMaxGpuMemoryMb(worker) < resourceRequirements.min_gpu_memory_mb
      ) {
        return false;
      }

      if (
        resourceRequirements.gpu_count &&
        (Number(worker?.gpu?.gpu_count) || 0) < resourceRequirements.gpu_count
      ) {
        return false;
      }

      return true;
    })
    .filter((worker) => hasRequiredTags(worker, resourceRequirements.required_tags))
    .filter((worker) => {
      if (!resourceRequirements.min_ram_mb) {
        return true;
      }

      return (Number(worker?.ram?.total_mb) || 0) >= resourceRequirements.min_ram_mb;
    })
    .sort((left, right) => (Number(right?.ram?.free_mb) || 0) - (Number(left?.ram?.free_mb) || 0));

  return candidates[0] || null;
}

function describeWorkerGpu(worker) {
  if (!worker?.gpu?.gpu_available || !Array.isArray(worker?.gpu?.gpus) || worker.gpu.gpus.length === 0) {
    return "No GPU";
  }

  return worker.gpu.gpus
    .map((gpu) => `${gpu.name} ${Number(((gpu.memory_mb || 0) / 1024).toFixed(0))}GB`)
    .join(", ");
}

const workerRoutes = express.Router();

workerRoutes.post("/workers/register", (req, res) => {
  try {
    const worker = {
      ...req.body,
      status: req.body?.status || "idle",
      current_job_id: req.body?.current_job_id || null,
      registered_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString()
    };

    workers.set(worker.worker_id, worker);
    process.stdout.write(
      `${JSON.stringify({
        ts: new Date().toISOString(),
        level: "info",
        message: "Worker registered",
        worker_id: worker.worker_id,
        gpu_summary: describeWorkerGpu(worker)
      })}\n`
    );

    return res.json({ ok: true, worker_id: worker.worker_id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

workerRoutes.post("/workers/heartbeat", (req, res) => {
  try {
    const existing = workers.get(req.body?.worker_id);
    if (!existing) {
      return res.status(404).json({ error: "Worker not registered" });
    }

    const updated = {
      ...existing,
      status: req.body?.status || existing.status,
      current_job_id: req.body?.current_job_id ?? existing.current_job_id,
      last_heartbeat_at: req.body?.timestamp || new Date().toISOString()
    };

    workers.set(updated.worker_id, updated);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

workerRoutes.get("/workers/:worker_id/next-job", (_req, res) => {
  return res.status(204).send();
});

workerRoutes.get("/workers", (_req, res) => {
  try {
    return res.json(
      Array.from(workers.values()).map((worker) => ({
        worker_id: worker.worker_id,
        hostname: worker.hostname,
        status: worker.status,
        executor_mode: worker.executor_mode,
        tags: worker.tags,
        gpu_available: worker?.gpu?.gpu_available || false,
        gpu_summary: describeWorkerGpu(worker),
        gpu_count: worker?.gpu?.gpu_count || 0,
        docker_available: worker?.docker?.docker_available || false,
        ram_gb: worker?.ram?.total_gb || 0,
        cpu_cores: worker?.cpu?.cores || 0,
        registered_at: worker.registered_at,
        last_heartbeat_at: worker.last_heartbeat_at,
        current_job_id: worker.current_job_id
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export { findWorkerForJob, describeWorkerGpu, workerRoutes };
