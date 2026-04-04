import config from "./config.js";
import logger from "./utils/logger.js";
import {
  registerWorker,
  pollForJob,
  sendHeartbeat,
  sendJobLogs,
  sendJobResult,
  updateJobStatus
} from "./api.js";
import { startHeartbeatLoop } from "./heartbeat.js";
import { runJob } from "./executor.js";
import contract from "../../shared/runtimeContract.cjs";

const LOG_FLUSH_INTERVAL_MS = 2000;
const { JOB_STATUS, NODE_STATUS } = contract;

class WorkerAgent {
  constructor(systemInfo) {
    this.systemInfo = systemInfo;
    this.workerId = config.workerId || systemInfo.hostname;
    this.status = NODE_STATUS.IDLE;
    this.currentJobId = null;
    this.heartbeatTimer = null;
    this.pollTimer = null;
    this.logFlushTimer = null;
    this.pollInFlight = false;
    this.logBuffer = [];
    this.registrationInFlight = null;
  }

  async start() {
    logger.info("Starting worker agent", {
      worker_id: this.workerId,
      executor_mode: config.executorMode
    });

    this.heartbeatTimer = startHeartbeatLoop(() => this.safeSendHeartbeat(), config.heartbeatIntervalMs);

    this.pollTimer = setInterval(() => {
      this.pollAndProcess().catch((error) => {
        logger.warn("Polling loop failed", { message: error.message });
      });
    }, config.pollIntervalMs);

    this.logFlushTimer = setInterval(() => {
      this.flushLogs().catch((error) => {
        logger.warn("Log flush failed", {
          worker_id: this.workerId,
          current_job_id: this.currentJobId,
          error: error.message
        });
      });
    }, LOG_FLUSH_INTERVAL_MS);

    await this.safeSendHeartbeat();
    await this.pollAndProcess();
  }

  async safeSendHeartbeat() {
    try {
      await sendHeartbeat(this.status, this.currentJobId);
    } catch (error) {
      if (error.message.includes("Worker not registered")) {
        await this.ensureRegistered();
      }

      logger.warn("Heartbeat failed", { worker_id: this.workerId, error: error.message });
    }
  }

  async pollAndProcess() {
    if (this.pollInFlight) {
      return;
    }

    if (this.status === "busy") {
      logger.debug("Skipping poll while busy", { current_job_id: this.currentJobId });
      return;
    }

    this.pollInFlight = true;

    try {
      const response = await pollForJob();
      const job = this.extractJob(response);
      if (!job) {
        return;
      }

      await this.processJob(job);
    } catch (error) {
      if (error.message.includes("Worker not registered")) {
        await this.ensureRegistered();
        return;
      }

      throw error;
    } finally {
      this.pollInFlight = false;
    }
  }

  async ensureRegistered() {
    if (this.registrationInFlight) {
      return this.registrationInFlight;
    }

    this.registrationInFlight = registerWorker(this.systemInfo)
      .then(() => {
        logger.info("Worker registration refreshed", {
          worker_id: this.workerId,
          backend_url: config.backendUrl
        });
      })
      .finally(() => {
        this.registrationInFlight = null;
      });

    return this.registrationInFlight;
  }

  extractJob(response) {
    if (!response) {
      return null;
    }

    return response.job || response.data?.job || response;
  }

  async processJob(job) {
    this.status = NODE_STATUS.BUSY;
    this.currentJobId = job.job_id;
    this.logBuffer = [];

    logger.info("Starting job", {
      worker_id: this.workerId,
      job_id: job.job_id,
      mode: job.execution_mode || "local",
      gpu_required: Boolean(job.resource_requirements?.gpu_required)
    });

    try {
      await updateJobStatus(job.job_id, JOB_STATUS.RUNNING, {
        executor_mode: config.executorMode
      });

      const result = await runJob(job, {
        onLog: async (entry) => {
          this.queueLog(entry);
        },
        onComplete: async () => {
          await this.flushLogs();
        },
        onFail: async () => {
          await this.flushLogs();
        }
      }, {
        systemInfo: this.systemInfo
      });

      await this.flushLogs();

      if (result.status === JOB_STATUS.COMPLETED) {
        await updateJobStatus(job.job_id, JOB_STATUS.COMPLETED, {
          executor_mode: config.executorMode
        });
        await sendJobResult(job.job_id, result.result || {});
        logger.info("Job completed", { worker_id: this.workerId, job_id: job.job_id });
      } else {
        await updateJobStatus(job.job_id, JOB_STATUS.FAILED, {
          executor_mode: config.executorMode
        });
        await sendJobResult(job.job_id, result.result || {});
        logger.warn("Job failed", {
          worker_id: this.workerId,
          job_id: job.job_id,
          error: result.result?.error || null
        });
      }
    } catch (error) {
      logger.error("Job execution failed", {
        worker_id: this.workerId,
        job_id: job.job_id,
        error: error.message
      });

      await this.flushLogs();
      await updateJobStatus(job.job_id, JOB_STATUS.FAILED, {
        executor_mode: config.executorMode,
        error: error.message
      });
      await sendJobResult(job.job_id, {
        exit_code: 1,
        output_files: [],
        error: error.message
      });
    } finally {
      this.status = NODE_STATUS.IDLE;
      this.currentJobId = null;
      this.logBuffer = [];
    }
  }

  queueLog(entry) {
    if (!entry || !entry.text) {
      return;
    }

    this.logBuffer.push({
      stream: entry.stream || "stdout",
      text: entry.text,
      ts: entry.ts || new Date().toISOString()
    });
  }

  async flushLogs() {
    if (!this.currentJobId || this.logBuffer.length === 0) {
      return;
    }

    const batch = this.logBuffer.splice(0, this.logBuffer.length);
    await sendJobLogs(this.currentJobId, batch);
  }

  stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    if (this.logFlushTimer) {
      clearInterval(this.logFlushTimer);
    }
  }
}

export default WorkerAgent;
