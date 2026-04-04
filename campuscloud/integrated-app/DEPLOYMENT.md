# CampusCloud Deployment Guide

## 1. Backend machine

1. Set a real reachable backend URL in `backend/.env`.
2. Start the backend on a machine reachable from every worker.
3. Open firewall access for port `5000`.

Recommended backend env additions:

```env
HOST=0.0.0.0
BACKEND_PUBLIC_URL=http://YOUR_BACKEND_IP:5000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STATE_TABLE=cluster_state_snapshots
BACKEND_INSTANCE_KEY=campuscloud-prod
```

## 2. Supabase

Run `backend/supabase/cluster_state_snapshots.sql` in the Supabase SQL editor.

This enables backend state snapshots so node/workspace/job state can survive backend restarts.

## 3. Worker machine checklist

Every worker machine must pass all of these locally before you expect distributed GPU execution to work:

```powershell
nvidia-smi
docker run --rm python:3.10-slim python --version
docker run --rm --gpus all nvidia/cuda:12.2.0-runtime-ubuntu22.04 nvidia-smi
```

## 4. Agent configuration

Set each worker to the shared backend host, never `localhost`, unless the worker and backend are on the same machine.

Example worker `.env`:

```env
BACKEND_URL=http://YOUR_BACKEND_IP:5000
WORKER_ID=gpu-laptop-02
NODE_NAME=GPU Laptop 02
WORKER_NAME=GPU Laptop 02
WORKER_TOKEN=GENERATED_PER_NODE_TOKEN
ALLOW_DOCKER=true
STARTUP_REQUIRE_DOCKER=true
STARTUP_REQUIRE_GPU_DOCKER=true
```

## 5. Workspace setup

Create a workspace first:

```powershell
Invoke-RestMethod -Method Post -Uri "http://YOUR_BACKEND_IP:5000/api/workspaces" -ContentType "application/json" -Body '{"id":"prod-workspace"}'
```

Then submit jobs into that workspace.

## 6. Job examples

Docker CPU job:

```json
{
  "workspace_id": "prod-workspace",
  "execution_mode": "docker",
  "image": "python:3.10-slim",
  "command": ["python", "-c", "print(123)"],
  "resource_requirements": {
    "gpu_required": false
  }
}
```

Docker GPU job:

```json
{
  "workspace_id": "prod-workspace",
  "execution_mode": "docker",
  "image": "nvidia/cuda:12.2.0-runtime-ubuntu22.04",
  "command": ["nvidia-smi"],
  "resource_requirements": {
    "gpu_required": true
  }
}
```

## 7. Operational model

The backend does not execute GPU work itself.

It assigns a job to a worker node.
That worker node launches Docker locally.
The container on that worker uses the GPU physically installed on that worker.

This means every worker needs its own local Docker + NVIDIA runtime configured correctly.
