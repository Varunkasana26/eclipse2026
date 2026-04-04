import io
import tarfile
from pathlib import Path

import docker
from docker.errors import APIError, BuildError, DockerException, ImageNotFound

from config import settings


class DockerRuntimeError(RuntimeError):
    pass


def get_docker_client() -> docker.DockerClient:
    try:
        return docker.DockerClient(base_url=settings.docker_socket)
    except DockerException as exc:  # pragma: no cover - environment specific
        raise DockerRuntimeError(f"Failed to connect to Docker daemon: {exc}") from exc


def resolve_template_image(template: str) -> tuple[str, Path]:
    template_path = settings.template_dir / template
    if template == "python":
        return settings.python_image_name, template_path
    if template == "pytorch":
        return settings.pytorch_image_name, template_path
    raise DockerRuntimeError(f"Unsupported template: {template}")


def ensure_runtime_image(client: docker.DockerClient, template: str) -> str:
    image_name, template_path = resolve_template_image(template)

    try:
        client.images.get(image_name)
        return image_name
    except ImageNotFound:
        pass
    except DockerException as exc:
        raise DockerRuntimeError(f"Unable to inspect Docker image {image_name}: {exc}") from exc

    dockerfile_path = template_path / "Dockerfile"
    if not dockerfile_path.exists():
        raise DockerRuntimeError(f"Missing Dockerfile for template '{template}'.")

    try:
        client.images.build(
            path=str(template_path),
            dockerfile="Dockerfile",
            tag=image_name,
            rm=True,
            pull=True,
        )
        return image_name
    except (BuildError, APIError, DockerException) as exc:
        raise DockerRuntimeError(f"Failed to build runtime image {image_name}: {exc}") from exc


def create_container(
    client: docker.DockerClient,
    *,
    image: str,
    command: list[str],
    sandbox_config: dict,
    use_gpu: bool,
):
    device_requests = None
    if use_gpu:
        device_requests = [
            docker.types.DeviceRequest(count=-1, capabilities=[["gpu"]]),
        ]

    try:
        return client.containers.create(
            image=image,
            command=command,
            auto_remove=True,
            detach=True,
            stdin_open=False,
            tty=False,
            device_requests=device_requests,
            **sandbox_config,
        )
    except DockerException as exc:
        raise DockerRuntimeError(f"Failed to create execution container: {exc}") from exc


def copy_file_to_container(container, source_file: Path, target_name: str = "job.py") -> None:
    """
    Fallback for environments where the Docker daemon cannot bind mount client-local paths.
    """
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w") as archive:
        payload = source_file.read_bytes()
        info = tarfile.TarInfo(name=target_name)
        info.size = len(payload)
        info.mode = 0o444
        archive.addfile(info, io.BytesIO(payload))

    buffer.seek(0)

    try:
        container.put_archive("/workspace", buffer.getvalue())
    except DockerException as exc:
        raise DockerRuntimeError(f"Failed to copy user code into container: {exc}") from exc
