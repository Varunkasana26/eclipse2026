function startAssignmentScheduler(orchestrator, intervalMs) {
  const tick = () => {
    if (typeof orchestrator.runMaintenanceSweep === "function") {
      orchestrator.runMaintenanceSweep();
      return;
    }

    orchestrator.assignQueuedJobs();
  };

  const timer = setInterval(() => {
    tick();
  }, intervalMs);

  return () => clearInterval(timer);
}

module.exports = {
  startAssignmentScheduler,
};
