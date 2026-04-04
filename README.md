# CampusCloud Worker Agent

This workspace now contains:

- `src/`: the GPU-aware CampusCloud worker agent
- `campuscloud-execution-service/`: the localhost-only Docker execution service
- `campuscloud-backend-additions/`: backend scheduler, routes, and payload examples

The worker agent never runs Docker directly. It registers with the backend over HTTP and delegates execution to `http://127.0.0.1:8000`.

## Worker env

```env
BACKEND_URL=http://your-backend-url
WORKER_SECRET=your-shared-secret
EXECUTOR_MODE=http
EXECUTOR_URL=http://127.0.0.1:8000
```

## Execution service env

```env
PORT=8000
GPU_DEVICE=all
MAX_CONCURRENT_JOBS=2
```

## Runtime flow

- backend -> `POST /api/workers/register`
- backend -> `POST /api/workers/heartbeat`
- backend -> `GET /api/workers/:worker_id/next-job`
- worker -> `POST http://127.0.0.1:8000/execute`
- worker -> `GET http://127.0.0.1:8000/status/:job_id`
- worker -> `POST http://127.0.0.1:8000/cancel/:job_id`

## Windows + NVIDIA GPU

1. Run in PowerShell as Admin: `wsl --install`, then reboot.
2. Install Docker Desktop with the WSL2 backend enabled.
3. In Docker Desktop, enable Ubuntu under WSL Integration.
4. Update the Windows NVIDIA driver from NVIDIA.
5. Open WSL2 Ubuntu and run `nvidia-smi`.
6. Install `nvidia-container-toolkit`, run `sudo nvidia-ctk runtime configure --runtime=docker`, and restart Docker Desktop.
7. Install Node.js 20 in WSL2.
8. Copy the project into WSL2.
9. Start `campuscloud-execution-service` in one terminal and the worker agent in another.
10. Verify with `curl http://127.0.0.1:8000/health`.

## Linux / cloud VM

1. Run `sudo bash campuscloud-execution-service/setup-gpu-worker.sh`.
2. Start `campuscloud-execution-service`.
3. Start the worker agent.

## GPU-ready images

- `nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04`
- `pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime`
- `tensorflow/tensorflow:2.15.0-gpu`
- `nvcr.io/nvidia/pytorch:24.01-py3`
