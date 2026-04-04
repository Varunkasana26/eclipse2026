# Setup Agent

## Required

- Node.js 20+
- Network reachability to backend host

## Optional for Docker execution

- Docker Desktop or Docker Engine
- NVIDIA Container Toolkit for GPU jobs

## Agent env

- `BACKEND_BASE_URL`
- `WORKER_NAME`
- `WORKER_TAGS`
- `EXECUTOR_MODE`

## Recommended modes

- `EXECUTOR_MODE=auto`
  Use Docker when available, otherwise safe local fallback.
- `EXECUTOR_MODE=mock`
  Simulate execution for demos when host execution is blocked.
