import config from "../config.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(job, hooks = {}) {
  const startedAt = Date.now();
  const durationMs = job.mock_duration_ms || config.mockJobDurationMs;
  const logIntervalMs = Math.max(250, config.mockLogIntervalMs);
  const steps = Math.max(1, Math.ceil(durationMs / logIntervalMs));
  const logs = [];

  try {
    for (let index = 0; index < steps; index += 1) {
      await sleep(logIntervalMs);
      const entry = {
        stream: "stdout",
        text: `mock executor step ${index + 1}/${steps} for job ${job.job_id}`,
        ts: new Date().toISOString()
      };

      logs.push(entry);

      if (typeof hooks.onLog === "function") {
        await hooks.onLog(entry);
      }
    }

    const failed = Boolean(job.mock_should_fail);
    const result = {
      exit_code: failed ? 1 : 0,
      output_files: failed
        ? []
        : [
            {
              name: "result.json",
              path: `/mock/${job.job_id}/result.json`,
              size_bytes: 256
            }
          ],
      duration_ms: Date.now() - startedAt,
      error: failed ? "Mock job failed by configuration." : null
    };

    if (failed) {
      if (typeof hooks.onFail === "function") {
        await hooks.onFail(result);
      }
    } else if (typeof hooks.onComplete === "function") {
      await hooks.onComplete(result);
    }

    return {
      status: failed ? "failed" : "completed",
      logs,
      result
    };
  } catch (error) {
    const result = {
      exit_code: 1,
      output_files: [],
      duration_ms: Date.now() - startedAt,
      error: error.message
    };

    if (typeof hooks.onFail === "function") {
      await hooks.onFail(result);
    }

    return {
      status: "failed",
      logs,
      result
    };
  }
}

export { run };
