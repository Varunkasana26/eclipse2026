const express = require("express");

function createOnboardingRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listOnboardingNodes() });
  });

  router.post("/nodes", (req, res) => {
    try {
      const setup = orchestrator.createOnboardingNode(req.body || {});
      return res.status(201).json({ setup });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get("/nodes/:workerId/env", (req, res) => {
    try {
      const token = req.query.token ? String(req.query.token) : "";
      const file = orchestrator.getOnboardingEnvFile(req.params.workerId, token);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
      return res.send(file.content);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  });

  router.get("/nodes/:workerId/setup-script", (req, res) => {
    try {
      const token = req.query.token ? String(req.query.token) : "";
      const file = orchestrator.getOnboardingSetupScript(req.params.workerId, token);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
      return res.send(file.content);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  });

  router.get("/nodes/:workerId/setup-guide", (req, res) => {
    try {
      const token = req.query.token ? String(req.query.token) : "";
      const file = orchestrator.getOnboardingSetupGuide(req.params.workerId, token);
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
      return res.send(file.content);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createOnboardingRoutes,
};
