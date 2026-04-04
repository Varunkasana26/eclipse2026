# CampusCloud Integrated App MVP

Demo-focused CampusCloud stack with three runnable parts:

- `backend/`: in-memory orchestrator with node registry, heartbeat tracking, job queue, assignment, status updates, and WebSocket fan-out
- `agent/`: provider node agent that registers, heartbeats, polls for assigned jobs, executes them, and streams logs/results
- `frontend/`: React dashboard for nodes, job submission, live status, and logs
- `shared/`: runtime contract docs and sample payloads
- `scripts/`: setup and demo run notes

## Folder structure

```text
integrated-app/
  backend/
  agent/
  frontend/
  shared/
  scripts/
```

## Quick start

```powershell
cd integrated-app
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item agent/.env.example agent/.env
Copy-Item frontend/.env.example frontend/.env
```

Start each process in its own terminal:

```powershell
cd backend
npm start
```

```powershell
cd agent
npm start
```

```powershell
cd frontend
npm start
```

Open `http://localhost:3000` and submit the local demo job. If Docker is unavailable or the Docker path fails, the agent falls back to local execution for demo continuity.

## Onboard a GPU PC

1. Start backend and frontend.
2. Open the dashboard and use the `Provider Onboarding` panel.
3. Create a GPU node setup.
4. Download the generated agent `.env` and `setup-<workerId>.ps1`.
5. Copy the `agent/` folder to the Windows GPU PC.
6. Place those downloaded files inside that folder.
7. Run the PowerShell setup script there, then run `npm install` and `npm start`.

If the GPU PC is on another machine, set `BACKEND_PUBLIC_URL` in `backend/.env` to the backend machine's LAN IP before creating the setup package.
