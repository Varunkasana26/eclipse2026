const express = require("express");

function createJobRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listJobs() });
  });

  router.post("/", (req, res) => {
    try {
      const payload = req.body || {};
      if (!Array.isArray(payload.command) || payload.command.length === 0) {
        return res.status(400).json({ error: "command is required and must be a non-empty array" });
      }

      const job = orchestrator.createJob(payload);
      return res.status(201).json({ job });
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
      const job = orchestrator.updateJobStatus(req.params.jobId, req.body || {});
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/:jobId/logs", (req, res) => {
    try {
      const job = orchestrator.appendJobLogs(req.params.jobId, req.body?.logs);
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/:jobId/result", (req, res) => {
    try {
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
