from docker.types import Mount

from config import settings


def build_sandbox_config(code_file_host_path: str) -> dict:
    """
    Return a centralized set of resource and security limits for user jobs.
    """
    return {
        "mounts": [
            Mount(
                target="/workspace/job.py",
                source=code_file_host_path,
                type="bind",
                read_only=True,
            )
        ],
        "network_disabled": settings.docker_network_disabled,
        "mem_limit": settings.memory_limit,
        "nano_cpus": settings.nano_cpus,
        "pids_limit": settings.pids_limit,
        "read_only": True,
        "tmpfs": {
            "/tmp": "rw,noexec,nosuid,size=64m",
            "/workspace": "rw,noexec,nosuid,size=16m",
        },
        "cap_drop": ["ALL"],
        "security_opt": ["no-new-privileges:true"],
        "user": "appuser",
        "working_dir": "/workspace",
    }
