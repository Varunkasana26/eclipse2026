const express = require("express");
const env = require("../config/env");
const { storeJobInputArtifact } = require("../services/jobAssetStorage.service");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function decodeHeaderValue(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function getPublicBaseUrl(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const protocol = String(forwardedProto || req.protocol || "http").split(",")[0].trim();
  const host = String(forwardedHost || req.get("host") || "").split(",")[0].trim();

  if (protocol && host) {
    return `${protocol}://${host}`;
  }

  return env.BACKEND_PUBLIC_URL;
}

function hasInlinePythonCode(body) {
  const candidates = [
    body?.python_code,
    body?.pythonCode,
    body?.code,
    body?.source_code,
    body?.sourceCode,
    body?.metadata?.python_code,
    body?.metadata?.pythonCode,
    body?.metadata?.code,
  ];

  return candidates.some((item) => typeof item === "string" && item.trim());
}

function validateJobRequest(body = {}) {
  const executionMode = String(body.execution_mode || body.executionMode || "local").trim().toLowerCase();
  const hasCommand = Array.isArray(body.command) && body.command.length > 0;
  const requiresGpu = Boolean(body.resource_requirements?.gpu_required || body.requires_gpu);

  if (executionMode === "docker") {
    if (!String(body.image || "").trim()) {
      throw new Error("Docker jobs require an image");
    }

    if (!hasCommand && !hasInlinePythonCode(body)) {
      throw new Error("Docker jobs require a command array or inline Python code");
    }
  }

  if ((executionMode === "gpu" || executionMode === "remote-gpu") && !hasInlinePythonCode(body)) {
    throw new Error("Remote GPU jobs require inline Python code");
  }

  if (requiresGpu && executionMode === "docker" && !String(body.image || "").trim()) {
    throw new Error("GPU Docker jobs require an NVIDIA-compatible image");
  }
}

function createJobRoutes(orchestrator) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    return res.json({ items: orchestrator.listJobs() });
  });

  router.post("/", (req, res) => {
    try {
      validateJobRequest(req.body || {});
      const response = orchestrator.createJob(req.body || {});
      return res.status(201).json(response);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.get("/:jobId", (req, res) => {
    const job = orchestrator.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({ job });
  });

  router.post(
    "/:jobId/assets",
    express.raw({ type: "application/octet-stream", limit: env.MAX_ASSET_UPLOAD_BYTES }),
    async (req, res) => {
      try {
        const currentJob = orchestrator.getJob(req.params.jobId);
        if (!currentJob) {
          return res.status(404).json({ error: "Job not found" });
        }

        const fileName = decodeHeaderValue(req.headers["x-file-name"]);
        if (!fileName) {
          return res.status(400).json({ error: "x-file-name header is required" });
        }

        const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
        if (fileBuffer.length === 0) {
          return res.status(400).json({ error: "Asset upload body is empty" });
        }

        const storedArtifact = await storeJobInputArtifact({
          jobId: req.params.jobId,
          fileName,
          contentType: decodeHeaderValue(req.headers["x-content-type"]) || "application/octet-stream",
          buffer: fileBuffer,
        });

        const baseUrl = getPublicBaseUrl(req);
        const artifact = {
          ...storedArtifact,
          download_url: `${baseUrl.replace(/\/+$/, "")}/artifacts/${storedArtifact.storage_path}`,
        };
        const complete = String(req.headers["x-upload-complete"] || "").toLowerCase() === "true";
        const job = orchestrator.addJobInputArtifact(req.params.jobId, artifact, { complete });

        return res.status(201).json({ ok: true, artifact, job });
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }
  );

  router.post("/:jobId/status", (req, res) => {
    try {
      if (!orchestrator.verifyWorkerToken(req.body?.worker_id, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const job = orchestrator.updateJobStatus(req.params.jobId, req.body || {});
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/:jobId/logs", (req, res) => {
    try {
      const currentJob = orchestrator.getJob(req.params.jobId);
      if (!currentJob || !orchestrator.verifyWorkerToken(currentJob.node_id, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const job = orchestrator.appendJobLogs(req.params.jobId, req.body?.logs);
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.post("/:jobId/result", (req, res) => {
    try {
      const currentJob = orchestrator.getJob(req.params.jobId);
      if (!currentJob || !orchestrator.verifyWorkerToken(currentJob.node_id, getBearerToken(req))) {
        return res.status(401).json({ error: "Worker authorization failed" });
      }

      const job = orchestrator.setJobResult(req.params.jobId, req.body || {});
      return res.json({ ok: true, job });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createJobRoutes,
};
