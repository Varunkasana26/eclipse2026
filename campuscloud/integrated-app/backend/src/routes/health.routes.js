const express = require("express");

function createHealthRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    const nodes = orchestrator.listNodes();
    const jobs = orchestrator.listJobs();

    return res.json({
      status: "ok",
      counts: {
        nodes: nodes.length,
        availableNodes: nodes.filter((node) => node.status === "idle").length,
        jobs: jobs.length,
        queuedJobs: jobs.filter((job) => job.status === "queued").length,
        runningJobs: jobs.filter((job) => job.status === "running" || job.status === "assigned").length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = {
  createHealthRoutes,
};
