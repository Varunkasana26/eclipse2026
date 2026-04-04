const cors = require("cors");
const express = require("express");
const http = require("http");
const morgan = require("morgan");

const env = require("./config/env");
const { createAuthRoutes } = require("./routes/auth.routes");
const { createWorkerRoutes } = require("./routes/workers.routes");
const { createNodeRoutes } = require("./routes/nodes.routes");
const { createJobRoutes } = require("./routes/jobs.routes");
const { createHealthRoutes } = require("./routes/health.routes");
const { startAssignmentScheduler } = require("./scheduler/assignmentScheduler");
const {
  createOrchestratorService,
} = require("./services/orchestrator.service");
const { createSocketServer } = require("./sockets/wsServer");

const app = express();
const orchestrator = createOrchestratorService({
  heartbeatTimeoutMs: env.HEARTBEAT_TIMEOUT_MS,
  maxLogsPerJob: env.MAX_LOGS_PER_JOB,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.use("/health", createHealthRoutes(orchestrator));
app.use("/api/auth", createAuthRoutes());
app.use("/api/nodes", createNodeRoutes(orchestrator));
app.use("/api/workers", createWorkerRoutes(orchestrator));
app.use("/api/jobs", createJobRoutes(orchestrator));
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

const server = http.createServer(app);
createSocketServer(server, orchestrator);
const stopScheduler = startAssignmentScheduler(
  orchestrator,
  env.ASSIGNMENT_SWEEP_MS,
);

server.listen(env.PORT, env.HOST, () => {
  console.log(
    `CampusCloud backend listening on http://${env.HOST}:${env.PORT}`,
  );
  console.log(
    `CampusCloud WebSocket available at ws://localhost:${env.PORT}/ws`,
  );
});

process.on("SIGINT", () => {
  stopScheduler();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopScheduler();
  process.exit(0);
});
