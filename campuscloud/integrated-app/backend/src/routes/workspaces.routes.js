const express = require("express");

function createWorkspaceRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listWorkspaces() });
  });

  router.post("/", (req, res) => {
    try {
      const workspace = orchestrator.createWorkspace(req.body || {});
      return res.status(201).json({ workspace });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createWorkspaceRoutes,
};
