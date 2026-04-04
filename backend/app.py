from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from config import settings
from executor.runner import ExecutionError, run_user_job


app = FastAPI(
    title="Containerized Execution Backend",
    version="1.0.0",
    description="Run user-submitted Python jobs inside secure Docker containers.",
)


class RunJobRequest(BaseModel):
    code: str = Field(..., min_length=1, description="Python source code to execute.")
    template: str = Field(
        ...,
        pattern="^(python|pytorch)$",
        description="Execution template to use.",
    )


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.post("/run-job")
def run_job(payload: RunJobRequest) -> dict:
    try:
        result = run_user_job(code=payload.code, template=payload.template)
    except ExecutionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(status_code=500, detail="Unexpected execution error.") from exc

    return result
