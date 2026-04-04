const { WebSocketServer } = require("ws");

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
        event: "snapshot",
        payload: {
          nodes: orchestrator.listNodes(),
          jobs: orchestrator.listJobs(),
        },
        ts: new Date().toISOString(),
      })
    );
  });

  return wss;
}

module.exports = {
  createSocketServer,
};
