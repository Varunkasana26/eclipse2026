const express = require("express");

function createWorkspaceRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listWorkspaces() });
  });

  return router;
}

module.exports = {
  createWorkspaceRoutes,
};
