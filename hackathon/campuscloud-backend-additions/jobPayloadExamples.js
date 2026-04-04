const nonGpuJobExample = {
  job_id: "job-cpu-001",
  image: "python:3.11-slim",
  command: ["python", "-c", "print('hello from cpu job')"],
  env: {},
  resource_requirements: {
    gpu_required: false
  }
};

const gpuTrainingJobExample = {
  job_id: "job-gpu-train-001",
  image: "pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime",
  command: ["python", "-c", "import torch; print(torch.cuda.get_device_name(0))"],
  env: {},
  resource_requirements: {
    gpu_required: true,
    gpu_count: 1,
    min_gpu_memory_mb: 8000
  }
};

const multiGpuJobExample = {
  job_id: "job-multi-gpu-001",
  image: "nvcr.io/nvidia/pytorch:24.01-py3",
  command: ["python", "-c", "print('using 2 gpus')"],
  env: {},
  resource_requirements: {
    gpu_required: true,
    gpu_count: 2
  }
};

const cudaInferenceJobExample = {
  job_id: "job-cuda-infer-001",
  image: "nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04",
  command: ["bash", "-lc", "nvidia-smi && echo inference-ready"],
  env: {},
  resource_requirements: {
    gpu_required: true,
    gpu_count: 1
  }
};

const workerRegistrationExample = {
  worker_id: "worker-a100-01",
  agent_version: "1.1.0",
  executor_mode: "http",
  tags: ["gpu", "a100", "training"],
  hostname: "gpu-node-01",
  platform: "linux",
  arch: "x64",
  os_type: "Linux",
  node_version: "v20.12.2",
  cpu: {
    model: "AMD EPYC 7V13",
    cores: 64,
    speed_mhz: 2450
  },
  ram: {
    total_mb: 524288,
    free_mb: 390144,
    total_gb: 512
  },
  gpu: {
    gpu_available: true,
    gpu_count: 2,
    gpus: [
      {
        index: 0,
        name: "NVIDIA A100-SXM4-80GB",
        memory_mb: 81920,
        memory_gb: 80,
        driver_version: "550.54.15",
        uuid: "GPU-AAAA",
        compute_cap: "8.0",
        power_limit_w: 400
      },
      {
        index: 1,
        name: "NVIDIA A100-SXM4-80GB",
        memory_mb: 81920,
        memory_gb: 80,
        driver_version: "550.54.15",
        uuid: "GPU-BBBB",
        compute_cap: "8.0",
        power_limit_w: 400
      }
    ]
  },
  docker: {
    docker_available: true,
    docker_version: "26.1.1"
  }
};

const workerRegistrationNoGpuExample = {
  worker_id: "worker-laptop-01",
  agent_version: "1.1.0",
  executor_mode: "mock",
  tags: ["dev", "laptop"],
  hostname: "developer-laptop",
  platform: "win32",
  arch: "x64",
  os_type: "Windows_NT",
  node_version: "v20.12.2",
  cpu: {
    model: "Intel(R) Core(TM) i7",
    cores: 8,
    speed_mhz: 2400
  },
  ram: {
    total_mb: 16384,
    free_mb: 9216,
    total_gb: 16
  },
  gpu: {
    gpu_available: false,
    gpu_count: 0,
    gpus: []
  },
  docker: {
    docker_available: false,
    docker_version: null
  }
};

export {
  nonGpuJobExample,
  gpuTrainingJobExample,
  multiGpuJobExample,
  cudaInferenceJobExample,
  workerRegistrationExample,
  workerRegistrationNoGpuExample
};
