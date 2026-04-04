const express = require("express");

function createNodeRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listNodes() });
  });

  return router;
}

module.exports = {
  createNodeRoutes,
};
