const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const env = require("../config/env");

function getArtifactStorageRoot() {
  return env.ARTIFACT_STORAGE_DIR;
}

function sanitizeSegment(value, fallback = "asset") {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function buildArtifactAbsolutePath(storagePath) {
  return path.join(getArtifactStorageRoot(), ...String(storagePath).split("/"));
}

async function ensureArtifactDirectory(storagePath) {
  const absolutePath = buildArtifactAbsolutePath(storagePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  return absolutePath;
}

async function storeJobInputArtifact({ jobId, fileName, contentType, buffer }) {
  const safeJobId = sanitizeSegment(jobId, "job");
  const safeFileName = sanitizeSegment(fileName, "asset.bin");
  const uniquePrefix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const storagePath = path.posix.join("jobs", safeJobId, "inputs", `${uniquePrefix}-${safeFileName}`);
  const absolutePath = await ensureArtifactDirectory(storagePath);

  await fs.writeFile(absolutePath, buffer);

  return {
    name: safeFileName,
    storage_path: storagePath,
    content_type: contentType || "application/octet-stream",
    size_bytes: buffer.length,
  };
}

module.exports = {
  getArtifactStorageRoot,
  storeJobInputArtifact,
};
