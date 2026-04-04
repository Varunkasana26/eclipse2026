# CampusCloud Event Contract

## Agent to backend

- `agent:register`
  Sent when a provider starts and announces node capabilities.
- `agent:heartbeat`
  Sent on an interval with node status and current job id.
- `job:log`
  Sent in batches while a job is running.
- `job:update`
  Sent when a job enters `running`, `completed`, or `failed`.
- `job:complete`
  Emitted by backend when terminal status becomes `completed`.
- `job:failed`
  Emitted by backend when terminal status becomes `failed`.

## Backend to agent

- `job:assign`
  Emitted when a queued job is matched to an idle node.

## Dashboard/backend API events

- `job:submit`
  Created when a user submits a job.

## REST endpoints

- `GET /health`
- `GET /api/nodes`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `POST /api/workers/register`
- `POST /api/workers/heartbeat`
- `GET /api/workers/:workerId/next-job`
- `POST /api/jobs/:jobId/status`
- `POST /api/jobs/:jobId/logs`
- `POST /api/jobs/:jobId/result`
