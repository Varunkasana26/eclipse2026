const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const archiver = require("archiver");

const AGENT_SOURCE_DIR = path.resolve(__dirname, "..", "..", "..", "agent");

function shouldIncludeAgentPath(sourcePath) {
  const relativePath = path.relative(AGENT_SOURCE_DIR, sourcePath);
  if (!relativePath || relativePath.startsWith("..")) {
    return true;
  }

  const segments = relativePath.split(path.sep);
  return !segments.includes("node_modules") && !segments.includes(".git");
}

function zipDirectory(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, path.basename(sourceDir));
    archive.finalize();
  });
}

async function createAgentPackageBundle({ workerId, envFile, setupScript, setupGuide }) {
  if (!workerId) {
    throw new Error("workerId is required");
  }

  const bundleBaseName = `campuscloud-agent-${workerId}`;
  const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), `${bundleBaseName}-`));
  const stagingRoot = path.join(tempRoot, bundleBaseName);
  const zipPath = path.join(tempRoot, `${bundleBaseName}.zip`);

  try {
    await fsp.cp(AGENT_SOURCE_DIR, stagingRoot, {
      recursive: true,
      filter: shouldIncludeAgentPath,
    });

    await fsp.writeFile(path.join(stagingRoot, ".env"), envFile.content, "utf8");
    await fsp.writeFile(path.join(stagingRoot, setupScript.fileName), setupScript.content, "utf8");
    await fsp.writeFile(path.join(stagingRoot, setupGuide.fileName), setupGuide.content, "utf8");
    await fsp.writeFile(
      path.join(stagingRoot, "README-FIRST.txt"),
      [
        "CampusCloud provider package",
        "",
        "1. Extract this package on the provider GPU machine.",
        `2. Review ${setupGuide.fileName}.`,
        `3. The generated .env is already included in ${path.basename(stagingRoot)}.`,
        "4. Open PowerShell in the extracted agent folder.",
        "5. Run npm install",
        "6. Run npm start",
      ].join("\n"),
      "utf8"
    );

    await zipDirectory(stagingRoot, zipPath);

    return {
      fileName: `${bundleBaseName}.zip`,
      filePath: zipPath,
      cleanup: async () => {
        await fsp.rm(tempRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fsp.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

module.exports = {
  createAgentPackageBundle,
};
