# CampusCloud Event Contract

## Runtime status values

- Node status: `idle`, `busy`, `offline`
- Job status: `queued`, `assigned`, `running`, `completed`, `failed`
- Execution mode: `auto`, `local`, `docker`, `mock`
- Scheduler lanes: `low`, `mid`, `high`

## Node shape surfaced to the dashboard

- `node_id`
- `workspace_id`
- `lane`
- `status`
- `gpu_available`
- `gpu_name`
- `vram_mb`
- `utilization_percent`
- `docker_ready`
- `current_alloc_percent`
- `max_alloc_percent`
- `current_queue_depth`
- `last_heartbeat`

## Job shape surfaced to the dashboard

- `id`
- `workspace_id`
- `status`
- `image`
- `command`
- `env`
- `requires_gpu`
- `lane_required`
- `estimated_gpu_percent`
- `chunk_count`
- `parent_job_id`
- `chunk_index`
- `chunk_total`
- `node_id`
- `logs`
- `result`
- `error`
- `chunk_progress` for parent jobs

## Agent to backend payloads

- `POST /api/workers/register`
  Uses `worker_id`, `node_name`, `workspace_id`, `node_lane`, `max_alloc_percent`, `allow_docker`, `cpu`, `ram`, `gpu`, and `docker`.
- `POST /api/workers/heartbeat`
  Uses `worker_id`, `status`, `current_job_id`, and `timestamp`.
- `POST /api/jobs/:jobId/status`
  Uses `worker_id`, `status`, `timestamp`, and optional execution metadata.
- `POST /api/jobs/:jobId/logs`
  Uses `{ logs: [{ stream, text, ts }] }`.
- `POST /api/jobs/:jobId/result`
  Uses the final result payload for the job.

## Backend to agent job payload

- `GET /api/workers/:workerId/next-job`
  Returns:
  - `job_id`
  - `parent_job_id`
  - `chunk_index`
  - `chunk_total`
  - `workspace_id`
  - `lane_required`
  - `estimated_gpu_percent`
  - `image`
  - `command`
  - `env`
  - `execution_mode`
  - `timeout_ms`
  - `resource_requirements`
  - `metadata`

## WebSocket events for dashboard

- `snapshot`
  Full current `nodes` and `jobs` state on connect.
- `agent:register`
  Published when a node registers or re-registers.
- `agent:heartbeat`
  Published on each heartbeat update.
- `job:submit`
  Published when a job or chunk parent is created.
- `job:assign`
  Published when a queued job is matched to a node.
- `job:update`
  Published on status changes, aggregate parent updates, and final result updates.
- `job:log`
  Published when new log batches arrive.
- `job:complete`
  Published when a job finishes successfully.
- `job:failed`
  Published when a job ends in failure.

## REST endpoints

- `GET /health`
- `GET /api/nodes`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `POST /api/jobs`
- `POST /api/workers/register`
- `POST /api/workers/heartbeat`
- `GET /api/workers/:workerId/next-job`
- `POST /api/jobs/:jobId/status`
- `POST /api/jobs/:jobId/logs`
- `POST /api/jobs/:jobId/result`
- `GET /api/onboarding`
- `POST /api/onboarding/nodes`
