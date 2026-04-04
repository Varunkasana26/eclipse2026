# Setup Node Machine

## Provider machine checklist

1. Install Node.js 20+.
2. Install Docker if you want containerized execution.
3. For NVIDIA providers, install the latest NVIDIA driver.
4. If using GPU containers, install NVIDIA Container Toolkit.
5. Clone the repo and open `campuscloud/integrated-app/agent`.
6. Copy `.env.example` to `.env` and point `BACKEND_BASE_URL` at the backend.
7. Start the agent with `npm start`.

## Validation

- Agent should register within a few seconds.
- Dashboard should show node status as `idle`.
- Submitting a local demo job should move node status to `busy` and back to `idle`.
