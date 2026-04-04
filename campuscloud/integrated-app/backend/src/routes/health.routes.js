const express = require("express");
const { JOB_STATUS, NODE_STATUS } = require("../../../shared/runtimeContract.cjs");

function createHealthRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    const nodes = orchestrator.listNodes();
    const jobs = orchestrator.listJobs();

    return res.json({
      status: "ok",
      counts: {
        nodes: nodes.length,
        availableNodes: nodes.filter((node) => node.status === NODE_STATUS.IDLE).length,
        jobs: jobs.length,
        queuedJobs: jobs.filter((job) => job.status === JOB_STATUS.QUEUED).length,
        runningJobs: jobs.filter((job) => job.status === JOB_STATUS.RUNNING || job.status === JOB_STATUS.ASSIGNED).length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = {
  createHealthRoutes,
};
