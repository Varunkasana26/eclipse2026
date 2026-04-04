#!/usr/bin/env bash
set -euo pipefail

# Windows + NVIDIA GPU:
# 1. Run in PowerShell as Admin: wsl --install -> reboot
# 2. Install Docker Desktop with WSL2 backend enabled
# 3. In Docker Desktop Settings -> Resources -> WSL Integration -> enable Ubuntu
# 4. Update Windows NVIDIA driver from nvidia.com
# 5. Open WSL2 Ubuntu terminal
# 6. Run: nvidia-smi
# 7. Install nvidia-container-toolkit using the commands below
# 8. Run: sudo nvidia-ctk runtime configure --runtime=docker
# 9. Restart Docker Desktop
# 10. Smoke test: docker run --rm --gpus all nvidia/cuda:12.0-base-ubuntu22.04 nvidia-smi
# 11. Install Node.js 20 inside WSL2
# 12. Copy project into WSL2: cp -r /mnt/c/Users/NAME/path ~/campuscloud
# 13. Terminal 1: cd campuscloud-execution-service && npm install && node src/index.js
# 14. Terminal 2: cd campuscloud-worker && npm install && node src/index.js
# 15. Verify: curl http://127.0.0.1:8000/health
#
# Linux / Cloud VM:
# 1. Run: sudo bash setup-gpu-worker.sh
# 2. Terminal 1: cd campuscloud-execution-service && npm install && node src/index.js
# 3. Terminal 2: cd campuscloud-worker && npm install && node src/index.js
#
# Required worker env:
# BACKEND_URL=http://your-backend-url
# WORKER_SECRET=your-shared-secret
# EXECUTOR_MODE=http
# EXECUTOR_URL=http://127.0.0.1:8000
#
# Required execution service env:
# PORT=8000
# GPU_DEVICE=all
# MAX_CONCURRENT_JOBS=2

if [[ ! -f /etc/os-release ]]; then
  echo "Unsupported system: /etc/os-release not found"
  exit 1
fi

source /etc/os-release
if [[ "${ID:-}" != "ubuntu" ]]; then
  echo "This setup script currently supports Ubuntu only"
  exit 1
fi

echo "Step 0: Ubuntu detected (${PRETTY_NAME})"

if ! command -v docker >/dev/null 2>&1; then
  echo "Step 1: Installing Docker Engine"
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "${SUDO_USER:-$USER}"
  systemctl enable docker
  systemctl start docker
else
  echo "Step 1: Docker already installed"
fi

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "Step 2: NVIDIA driver not found, installing recommended driver"
  apt-get update
  apt-get install -y ubuntu-drivers-common
  ubuntu-drivers autoinstall
  echo "Driver installed. Reboot the machine, then rerun this script."
  exit 0
else
  echo "Step 2: NVIDIA driver detected"
fi

echo "Step 3: Installing nvidia-container-toolkit"
apt-get update
apt-get install -y curl gpg ca-certificates
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  > /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-get update
apt-get install -y nvidia-container-toolkit

echo "Step 4: Configuring NVIDIA runtime for Docker"
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null)" != v20* ]]; then
  echo "Step 5: Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "Step 5: Node.js 20 already present"
fi

echo "Step 6: Running GPU Docker smoke test"
docker run --rm --gpus all nvidia/cuda:12.0-base-ubuntu22.04 nvidia-smi

echo "Step 7: Success"
echo "Next steps:"
echo "1. cd campuscloud-execution-service && npm install && node src/index.js"
echo "2. cd campuscloud-worker && npm install && node src/index.js"
echo "3. Verify with curl http://127.0.0.1:8000/health"
