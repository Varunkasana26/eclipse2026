# Eclipse2026 Hackathon Repo

This repository now contains both the original remote project and the CampusCloud worker-side additions merged into one branch.

## Main parts

- `backend/`
  Existing Python containerized execution backend from the remote repository
- `Backend/`
  Existing Node/Prisma lab-booking backend from the remote repository
- `src/`
  CampusCloud Worker Node Agent
- `campuscloud-execution-service/`
  Local execution service for the worker machine
- `campuscloud-backend-additions/`
  Worker scheduling and payload examples for backend integration

## CampusCloud worker architecture

The Worker Node Agent does not run Docker directly. It:

- registers with the backend over HTTP
- sends heartbeats every 5 seconds
- polls for jobs every few seconds
- marks itself busy while a job is running
- delegates execution to the local service on `http://127.0.0.1:8000`
- forwards `running`, `completed`, and `failed` updates
- returns logs and result metadata

## Worker agent files

- `package.json`
- `.env.example`
- `src/index.js`
- `src/config.js`
- `src/systemInfo.js`
- `src/api.js`
- `src/agent.js`
- `src/executors/mockExecutor.js`
- `src/executors/httpExecutor.js`
- `src/utils/logger.js`

## Worker agent env

```env
NODE_ENV=development
BACKEND_BASE_URL=http://127.0.0.1:5000
BACKEND_API_KEY=
WORKER_ID=
WORKER_NAME=worker-laptop-01
WORKER_TAGS=hackathon,dev
HEARTBEAT_INTERVAL_MS=5000
POLL_INTERVAL_MS=4000
REQUEST_TIMEOUT_MS=10000
EXECUTOR_MODE=mock
EXECUTOR_BASE_URL=http://127.0.0.1:8000
MOCK_JOB_DURATION_MS=6000
MOCK_LOG_INTERVAL_MS=1000
```

## Worker modes

- `EXECUTOR_MODE=mock`
  Laptop-friendly development mode with simulated logs and results
- `EXECUTOR_MODE=http`
  Real worker mode using the local execution service

## Local execution service

Expected local endpoints:

- `GET /health`
- `GET /jobs`
- `POST /run`

The execution service owns:

- Docker execution
- optional GPU access
- sandbox flags
- log capture
- output file creation
- cleanup

## GPU notes

GPU access should be configured on the worker host and used by the local execution service, not the Worker Node Agent.

For NVIDIA-backed workers:

1. Install the NVIDIA driver on the host
2. Install Docker or Docker Desktop
3. Install NVIDIA Container Toolkit
4. Configure Docker runtime with `nvidia-ctk runtime configure --runtime=docker`
5. Restart Docker
6. Verify container GPU access with `nvidia-smi`

## Push-safe notes

- `.env` is ignored for the worker agent
- `node_modules/` is ignored
- zip artifacts are ignored
- Python virtualenv and cache files are ignored
