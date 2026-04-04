function startAssignmentScheduler(orchestrator, intervalMs) {
  const timer = setInterval(() => {
    orchestrator.assignQueuedJobs();
  }, intervalMs);

  return () => clearInterval(timer);
}

module.exports = {
  startAssignmentScheduler,
};
