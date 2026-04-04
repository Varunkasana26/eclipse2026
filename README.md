# CampusCloud Workspace

## Primary app

Use the restructured app under:

`campuscloud/integrated-app`

### Modules

- `backend/`
  Express + WebSocket orchestrator with in-memory nodes, queue, job tracking, and assignment
- `agent/`
  Provider agent with system detection, heartbeat, job polling, Docker execution, and local/mock fallback
- `frontend/`
  React/Tailwind dashboard for nodes, job submission, status, and logs
- `shared/`
  Event contract and sample job payloads
- `scripts/`
  Demo and setup runbooks

## Run order

1. Start `campuscloud/integrated-app/backend`
2. Start `campuscloud/integrated-app/agent`
3. Start `campuscloud/integrated-app/frontend`

See:

- `campuscloud/integrated-app/scripts/run-demo.md`
- `campuscloud/integrated-app/scripts/setup-agent.md`
- `campuscloud/integrated-app/scripts/setup-node-machine.md`

## Legacy folders

These still exist for reference and later cleanup, but they are no longer the preferred demo path:

- `hackathon/`
- `Frontend/`
- `Frontend/Backend/`
- `hackathon/python-backend/`
