FROM python:3.11-slim

# Create a locked-down non-root user for executing untrusted jobs.
RUN useradd --create-home --shell /usr/sbin/nologin appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /workspace
USER appuser

CMD ["python", "--version"]
