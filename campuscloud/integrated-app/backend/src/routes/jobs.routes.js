const express = require("express");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function createJobRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listJobs() });
  });

  router.post("/", (req, res) => {
    try {
      const response = orchestrator.createJob(req.body || {});
      return res.status(201).json(response);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get("/:jobId", (req, res) => {
    const job = orchestrator.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({ job });
  });

  router.post("/:jobId/status", (req, res) => {
    try {
      if (!orchestrator.verifyWorkerToken(req.body?.worker_id, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const job = orchestrator.updateJobStatus(req.params.jobId, req.body || {});
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/:jobId/logs", (req, res) => {
    try {
      const currentJob = orchestrator.getJob(req.params.jobId);
      if (!currentJob || !orchestrator.verifyWorkerToken(currentJob.node_id, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const job = orchestrator.appendJobLogs(req.params.jobId, req.body?.logs);
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/:jobId/result", (req, res) => {
    try {
      const currentJob = orchestrator.getJob(req.params.jobId);
      if (!currentJob || !orchestrator.verifyWorkerToken(currentJob.node_id, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const job = orchestrator.setJobResult(req.params.jobId, req.body || {});
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createJobRoutes,
};
