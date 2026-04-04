from pathlib import Path
from uuid import uuid4

from requests.exceptions import ReadTimeout

from config import settings
from executor.docker_utils import (
    DockerRuntimeError,
    copy_file_to_container,
    create_container,
    ensure_runtime_image,
    get_docker_client,
)
from executor.sandbox import build_sandbox_config


class ExecutionError(RuntimeError):
    pass


def save_user_code(code: str) -> Path:
    """
    Persist the submitted job to disk so Docker can mount it into the sandbox.
    """
    job_id = uuid4().hex
    job_dir = settings.user_code_dir / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    code_file = job_dir / "job.py"
    code_file.write_text(code, encoding="utf-8")
    return code_file.resolve()


def run_user_job(*, code: str, template: str) -> dict:
    code_file = save_user_code(code)
    client = None

    try:
        client = get_docker_client()
        image_name = ensure_runtime_image(client, template)
        sandbox_config = build_sandbox_config(str(code_file))

        used_bind_mount = True
        try:
            container = create_container(
                client,
                image=image_name,
                command=["python", "/workspace/job.py"],
                sandbox_config=sandbox_config,
                use_gpu=(template == "pytorch"),
            )
        except DockerRuntimeError as exc:
            error_message = str(exc).lower()
            mount_issue = (
                "mount" in error_message
                or "bind source path does not exist" in error_message
                or "invalid mount config" in error_message
            )
            if not mount_issue:
                raise

            # Docker-in-Docker style demos can fail to bind mount client-local paths.
            # Fall back to copying the code into a tmpfs-backed workspace.
            fallback_config = dict(sandbox_config)
            fallback_config.pop("mounts", None)
            container = create_container(
                client,
                image=image_name,
                command=["python", "/workspace/job.py"],
                sandbox_config=fallback_config,
                use_gpu=(template == "pytorch"),
            )
            copy_file_to_container(container, code_file)
            used_bind_mount = False

        container.start()

        try:
            result = container.wait(timeout=settings.execution_timeout_seconds)
            timed_out = False
        except ReadTimeout:
            timed_out = True
            container.kill()
            result = {"StatusCode": 124}

        raw_logs = container.logs(stdout=True, stderr=True)
        output = raw_logs.decode("utf-8", errors="replace")

        return {
            "template": template,
            "status_code": result.get("StatusCode", 1),
            "timed_out": timed_out,
            "output": output,
            "job_file": str(code_file),
            "used_bind_mount": used_bind_mount,
        }
    except DockerRuntimeError as exc:
        raise ExecutionError(str(exc)) from exc
    finally:
        if client is not None:
            client.close()
