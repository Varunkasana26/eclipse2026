const express = require("express");

function createWorkerRoutes(orchestrator) {
  const router = express.Router();

  router.post("/register", (req, res) => {
    try {
      const node = orchestrator.registerNode(req.body || {});
      return res.json({ ok: true, node });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/heartbeat", (req, res) => {
    try {
      const node = orchestrator.heartbeat(req.body || {});
      return res.json({ ok: true, node });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get("/:workerId/next-job", (req, res) => {
    try {
      const job = orchestrator.pollNextJob(req.params.workerId);
      if (!job) {
        return res.status(204).send();
      }

      return res.json({ job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createWorkerRoutes,
};
