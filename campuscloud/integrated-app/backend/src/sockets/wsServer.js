const { WebSocketServer } = require("ws");
const { EVENT_TYPES } = require("../../../shared/runtimeContract.cjs");

function createSocketServer(server, orchestrator) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  function broadcast(message) {
    const encoded = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(encoded);
      }
    }
  }

  orchestrator.events.on("message", (message) => {
    broadcast(message);
  });

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        event: EVENT_TYPES.SNAPSHOT,
        payload: {
          nodes: orchestrator.listNodes(),
          jobs: orchestrator.listJobs(),
        },
        ts: new Date().toISOString(),
      })
    );
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error", {
      code: error.code || "UNKNOWN",
      message: error.message,
    });
  });

  return wss;
}

module.exports = {
  createSocketServer,
};
