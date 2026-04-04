function startHeartbeatLoop(callback, intervalMs) {
  return setInterval(() => {
    callback().catch(() => {});
  }, intervalMs);
}

export { startHeartbeatLoop };
