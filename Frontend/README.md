# CampusCloud Execution MVP

Minimal Docker-based execution system for a hackathon project. A submitted Python job runs inside a container, prints logs to stdout, writes output files to the mounted job folder, and the container is removed after execution.

## Role Fit

This setup is designed for the Execution / Container / Streaming Lead role:

- Docker-based execution flow
- Optional GPU-enabled execution with NVIDIA support
- Runtime templates for new jobs
- Basic sandboxing for safer hackathon demos
- Host-side log streaming through a simple Python runner

## Project Structure

```text
campuscloud-execution/
|-- docker/
|   |-- Dockerfile.cpu
|   `-- Dockerfile.gpu
|-- api/
|   `-- main.py
|-- executor/
|   `-- run_job.py
|-- jobs/
|   `-- job_1/
|       |-- input/
|       |-- output/
|       `-- script.py
|-- scripts/
|   |-- run_job.ps1
|   `-- run_job.sh
|-- templates/
|   |-- python-basic/
|   |   `-- script.py
|   |-- python-gpu/
|   |   `-- script.py
|   `-- README.md
|-- .gitignore
|-- requirements.txt
`-- README.md
```

## What This MVP Does

- Runs a Python job inside Docker
- Supports `cpu` and optional `gpu` execution modes
- Prints logs to stdout
- Streams logs live with a host-side Python runner
- Saves job outputs under `jobs/<job_id>/output/`
- Uses `--rm` so containers are deleted after each run
- Adds basic safety with non-root execution, CPU and memory limits, PID limits, `--network=none`, and `no-new-privileges`

## Setup

1. Install Docker Desktop or Docker Engine.
2. Make sure Docker is running.
3. From the project root, build the images:

```bash
docker build -t campus-cpu -f docker/Dockerfile.cpu .
docker build -t campus-gpu -f docker/Dockerfile.gpu .
```

Optional local Python environment for the host runner:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

Start the API server:

```bash
uvicorn api.main:app --reload
```

## Run a Job

From the `campuscloud-execution` directory:

```bash
sh scripts/run_job.sh job_1 cpu
```

For GPU mode:

```bash
sh scripts/run_job.sh job_1 gpu
```

On Windows PowerShell:

```powershell
.\scripts\run_job.ps1 -JobId job_1 -Mode cpu
.\scripts\run_job.ps1 -JobId job_1 -Mode gpu
```

Using the Python streaming runner:

```bash
python executor/run_job.py job_1 cpu
python executor/run_job.py job_1 gpu
```

Using the API:

```bash
curl -X POST http://127.0.0.1:8000/run \
  -H "Content-Type: application/json" \
  -d "{\"job_id\":\"job_1\",\"mode\":\"cpu\"}"
```

## Equivalent Direct Docker Commands

CPU:

```bash
docker run --rm \
  --memory=512m \
  --cpus=1 \
  --pids-limit=128 \
  --network=none \
  --security-opt=no-new-privileges \
  -v "$(pwd)/jobs/job_1:/app" \
  -w /app \
  campus-cpu \
  python script.py
```

GPU:

```bash
docker run --rm \
  --gpus all \
  --memory=512m \
  --cpus=1 \
  --pids-limit=128 \
  --network=none \
  --security-opt=no-new-privileges \
  -v "$(pwd)/jobs/job_1:/app" \
  -w /app \
  campus-gpu \
  python script.py
```

## GPU Verification

Check that the NVIDIA drivers and GPU are visible on the host:

```bash
nvidia-smi
```

Install Docker Desktop with GPU support or Docker Engine plus NVIDIA Container Toolkit on Linux, then verify Docker can see the GPU:

```bash
docker run --rm --gpus all pytorch/pytorch:latest nvidia-smi
```

The sample job also prints:

```python
print(torch.cuda.is_available())
```

If GPU is available, the output should be `True`.

## Runtime Templates

Starter job templates are included in `templates/` so new jobs can be created quickly.

CPU template:

```bash
cp -r templates/python-basic jobs/job_2
sh scripts/run_job.sh job_2 cpu
```

GPU template:

```bash
cp -r templates/python-gpu jobs/job_gpu
sh scripts/run_job.sh job_gpu gpu
```

## Host-Side Streaming

`executor/run_job.py` is a tiny host runner that:

- validates the job folder
- builds the correct Docker command
- streams container logs live to stdout
- returns the container exit code

## API Demo

`api/main.py` provides a tiny FastAPI service with:

- `GET /health` for a quick health check
- `GET /jobs` to list available job folders
- `POST /run` to launch a job in Docker and return logs plus output metadata

## Sample Job

The sample job in `jobs/job_1/script.py`:

- Prints `Job started`
- Performs a small computation
- Checks GPU availability with PyTorch
- Writes `output/result.txt`
- Prints `Job finished`

The output file is created at:

```text
jobs/job_1/output/result.txt
```

## Example Stdout

```text
Job started
Computed sum of squares for [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]: 385
torch.cuda.is_available(): False
Result written to /app/output/result.txt
Job finished
```

## Example Output File

```text
CampusCloud execution result
sum_of_squares=385
gpu_available=False
```

## Notes

- This is intentionally simple and hackathon-friendly.
- It is an MVP, not a production sandbox.
- `jobs/<job_id>/input/` is available for future input files if needed.
- For an optional gaming/streaming demo, Sunshine or Parsec can be installed on the GPU host separately, but they are not required for this execution MVP.
