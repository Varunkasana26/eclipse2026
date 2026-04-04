const express = require("express");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function createWorkerRoutes(orchestrator) {
  const router = express.Router();

  router.post("/register", (req, res) => {
    try {
      const workerId = req.body?.worker_id || req.body?.node_id;
      if (!orchestrator.verifyWorkerToken(workerId, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const node = orchestrator.registerNode(req.body || {});
      return res.json({ ok: true, node });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/heartbeat", (req, res) => {
    try {
      const workerId = req.body?.worker_id || req.body?.node_id;
      if (!orchestrator.verifyWorkerToken(workerId, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const node = orchestrator.heartbeat(req.body || {});
      return res.json({ ok: true, node });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get("/:workerId/next-job", (req, res) => {
    try {
      if (!orchestrator.verifyWorkerToken(req.params.workerId, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

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
