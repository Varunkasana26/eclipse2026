# Containerized GPU Job Runner

This project is a hackathon-ready backend that executes user-submitted Python code inside isolated Docker containers. It supports a basic Python runtime and an optional PyTorch runtime with GPU acceleration through the NVIDIA Container Toolkit.

## Project Structure

```text
project/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── Dockerfile
│   ├── executor/
│   │   ├── docker_utils.py
│   │   ├── runner.py
│   │   └── sandbox.py
│   ├── requirements.txt
│   ├── templates/
│   │   ├── python/
│   │   │   └── Dockerfile
│   │   └── pytorch/
│   │       └── Dockerfile
│   └── user_code/
│       └── example_gpu_test.py
├── docker-compose.yml
└── .env
```

## What It Does

- Exposes `POST /run-job` for executing Python jobs.
- Saves each submission under `backend/user_code/`.
- Builds runtime images automatically the first time each template is used.
- Runs jobs with strong container restrictions for hackathon-safe demos.
- Supports GPU access for the `pytorch` template when the host has NVIDIA runtime support.

## Security Model

Each job container is launched with these restrictions:

- Read-only root filesystem
- Read-only mounted user code
- Non-root user (`appuser`)
- No network access
- Memory limit of `1g`
- CPU limit of `1 core`
- PID limit of `64`
- All Linux capabilities dropped
- `no-new-privileges` enabled
- Timeout after `5` seconds

Note: This is a strong hackathon-oriented sandbox, but not a complete multi-tenant isolation boundary for production. For production use, add stronger isolation such as gVisor, Kata Containers, VM-based workers, or dedicated queue-based execution nodes.

## Prerequisites

### 1. Install Python 3.10+

Use Python 3.10 or newer if you want to run the backend directly on the host.

### 2. Install Docker

Install Docker Desktop or Docker Engine:

- Docker Desktop: https://docs.docker.com/desktop/
- Docker Engine: https://docs.docker.com/engine/install/

After installation, verify:

```bash
docker --version
docker info
```

### 3. Install NVIDIA Container Toolkit for GPU Support

If you want the `pytorch` template to access GPUs, install the NVIDIA driver and NVIDIA Container Toolkit on the Docker host.

Official install guide:

- https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html

After installation, verify GPU access:

```bash
docker run --rm --gpus all nvidia/cuda:12.3.2-base-ubuntu22.04 nvidia-smi
```

If that command works, the PyTorch runtime in this project will be able to request GPU devices.

## Quick Start

### Option A: Run with Docker Compose

From the `project/` directory:

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:8000
```

Configuration is loaded from [`project/.env`](/c:/Users/harki/OneDrive/Desktop/Hackathon%20p4/project/.env) using the `APP_` prefix to avoid conflicts with machine-wide environment variables.
On Windows, the default Docker endpoint is the named pipe `npipe:////./pipe/docker_engine`. On Linux, use `/var/run/docker.sock`.

### Option B: Run Backend Directly on Host

From the `project/backend/` directory:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## API Usage

### Health Check

```bash
curl http://localhost:8000/health
```

### Run a Basic Python Job

```bash
curl -X POST http://localhost:8000/run-job \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"hello from python sandbox\")",
    "template": "python"
  }'
```

### Run a PyTorch GPU Job

```bash
curl -X POST http://localhost:8000/run-job \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import torch\nprint(torch.cuda.is_available())\nprint(torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"no gpu\")",
    "template": "pytorch"
  }'
```

Example response:

```json
{
  "template": "python",
  "status_code": 0,
  "timed_out": false,
  "output": "hello from python sandbox\n",
  "job_file": "/app/user_code/abcd1234/job.py"
}
```

## How Runtime Templates Work

- `backend/templates/python/Dockerfile`
  - Lightweight Python runtime for standard jobs
- `backend/templates/pytorch/Dockerfile`
  - PyTorch runtime with CUDA support for GPU jobs

The backend uses the Docker SDK to:

1. Save the submission to disk.
2. Ensure the selected runtime image exists.
3. Launch a restricted container.
4. Mount the user script as read-only.
5. Execute `python /workspace/job.py`.
6. Capture stdout and stderr.
7. Auto-remove the container after completion.

## GPU Notes

- The backend requests GPU devices only for the `pytorch` template.
- Internally this maps to Docker's GPU device request API, equivalent to `--gpus all`.
- If the host is missing NVIDIA runtime support, PyTorch jobs may still run, but GPU will not be available.

## Streaming Placeholder

If you want live remote desktop streaming for demos:

- Sunshine can stream the host machine with low latency.
- Parsec can be used for remote access to a GPU host.
- A common hackathon setup is:
  - Run this backend on the GPU machine.
  - Expose the API over a tunnel or local network.
  - Use Sunshine or Parsec only for remote operator access, not for sandboxed job execution itself.

This project does not implement streaming directly, but the backend is structured so that remote demo tooling can be added around it.

## Important Operational Notes

- The backend container mounts `/var/run/docker.sock` to control sibling containers.
- This is convenient for demos and hackathons, but should be replaced by a dedicated execution service in production.
- The project stores user submissions in `backend/user_code/` so you can inspect them after a run.

## Demo Script Idea

Try the included GPU sample locally by sending the contents of `backend/user_code/example_gpu_test.py` through the API with the `pytorch` template.

## Next Steps

Good enhancements after the hackathon:

- Add job queueing with Redis or RabbitMQ
- Persist execution metadata in PostgreSQL
- Stream logs over WebSocket
- Add authentication and per-user quotas
- Add stronger isolation with VM-based workers
