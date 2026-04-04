const cors = require("cors");
const express = require("express");
const http = require("http");
const morgan = require("morgan");

const env = require("./config/env");
const { createAuthRoutes } = require("./routes/auth.routes");
const { createWorkerRoutes } = require("./routes/workers.routes");
const { createNodeRoutes } = require("./routes/nodes.routes");
const { createJobRoutes } = require("./routes/jobs.routes");
const { createWorkspaceRoutes } = require("./routes/workspaces.routes");
const { createHealthRoutes } = require("./routes/health.routes");
const { createOnboardingRoutes } = require("./routes/onboarding.routes");
const { startAssignmentScheduler } = require("./scheduler/assignmentScheduler");
const { createOrchestratorService } = require("./services/orchestrator.service");
const { createSocketServer } = require("./sockets/wsServer");

const DEFAULT_PORT = Number(process.env.PORT || env.PORT || 5000);
const MAX_PORT_ATTEMPTS = Math.max(1, Number(process.env.PORT_FALLBACK_ATTEMPTS) || 10);

let activeRuntime = null;

function getBackendPublicUrl(port) {
  if (process.env.BACKEND_PUBLIC_URL) {
    return process.env.BACKEND_PUBLIC_URL.replace(/\/+$/, "");
  }

  return `http://127.0.0.1:${port}`;
}

function createRuntime(port) {
  const app = express();
  const orchestrator = createOrchestratorService({
    heartbeatTimeoutMs: env.HEARTBEAT_TIMEOUT_MS,
    maxLogsPerJob: env.MAX_LOGS_PER_JOB,
    backendPublicUrl: getBackendPublicUrl(port),
    workerSecret: env.WORKER_SECRET,
    defaultWorkspaceId: env.DEFAULT_WORKSPACE_ID,
    defaultMaxAllocPercent: env.DEFAULT_MAX_ALLOC_PERCENT,
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
    })
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", createHealthRoutes(orchestrator));
  app.use("/api/auth", createAuthRoutes());
  app.use("/api/onboarding", createOnboardingRoutes(orchestrator));
  app.use("/api/nodes", createNodeRoutes(orchestrator));
  app.use("/api/workspaces", createWorkspaceRoutes(orchestrator));
  app.use("/api/workers", createWorkerRoutes(orchestrator));
  app.use("/api/jobs", createJobRoutes(orchestrator));
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

  const server = http.createServer(app);
  const stopScheduler = startAssignmentScheduler(orchestrator, env.ASSIGNMENT_SWEEP_MS);
  let wss = null;

  return {
    port,
    server,
    orchestrator,
    attachSockets() {
      wss = createSocketServer(server, orchestrator);
    },
    stop() {
      stopScheduler();
      if (wss) {
        wss.close();
      }
      if (server.listening) {
        server.close();
      }
    },
  };
}

function listenWithRetry(startPort, maxAttempts) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryPort = (port) => {
      attempts += 1;
      const runtime = createRuntime(port);

      const handleListening = () => {
        runtime.server.off("error", handleError);
        runtime.attachSockets();
        resolve(runtime);
      };

      const handleError = (error) => {
        runtime.server.off("listening", handleListening);
        runtime.stop();

        if (error.code === "EADDRINUSE" && attempts < maxAttempts) {
          console.warn(
            `Port ${port} is already in use. Retrying on port ${port + 1} (${attempts}/${maxAttempts}).`
          );
          tryPort(port + 1);
          return;
        }

        reject(error);
      };

      runtime.server.once("listening", handleListening);
      runtime.server.once("error", handleError);
      runtime.server.listen(port, env.HOST);
    };

    tryPort(startPort);
  });
}

async function startServer() {
  try {
    activeRuntime = await listenWithRetry(DEFAULT_PORT, MAX_PORT_ATTEMPTS);
    const publicUrl = getBackendPublicUrl(activeRuntime.port);

    console.log(`CampusCloud backend listening on http://${env.HOST}:${activeRuntime.port}`);
    console.log(`CampusCloud backend public URL ${publicUrl}`);
    console.log(`CampusCloud WebSocket available at ws://localhost:${activeRuntime.port}/ws`);
  } catch (error) {
    console.error("Failed to start CampusCloud backend", {
      code: error.code || "UNKNOWN",
      message: error.message,
      host: env.HOST,
      port: DEFAULT_PORT,
    });
  }
}

function shutdown(signal) {
  if (activeRuntime) {
    console.log(`Received ${signal}. Shutting down CampusCloud backend.`);
    activeRuntime.stop();
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
