FROM pytorch/pytorch:2.2.2-cuda12.1-cudnn8-runtime

# Match the non-root execution model used by the basic Python runtime.
RUN useradd --create-home --shell /usr/sbin/nologin appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /workspace
USER appuser

CMD ["python", "--version"]
