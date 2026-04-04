import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
load_dotenv(PROJECT_DIR / ".env")


DEFAULT_DOCKER_SOCKET = (
    "npipe:////./pipe/docker_engine"
    if os.name == "nt"
    else "unix://var/run/docker.sock"
)


class Settings(BaseSettings):
    app_name: str = "gpu-execution-backend"
    debug: bool = False
    docker_network_disabled: bool = True
    execution_timeout_seconds: int = 5
    memory_limit: str = "1g"
    nano_cpus: int = 1_000_000_000
    pids_limit: int = 64
    user_code_dir: Path = BASE_DIR / "user_code"
    template_dir: Path = BASE_DIR / "templates"
    python_image_name: str = "hackathon-python-runtime:latest"
    pytorch_image_name: str = "hackathon-pytorch-runtime:latest"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    docker_socket: str = DEFAULT_DOCKER_SOCKET

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=str(PROJECT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
settings.user_code_dir.mkdir(parents=True, exist_ok=True)
