# Run Demo

## 1. Install once from `integrated-app`

```powershell
cd integrated-app
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item agent/.env.example agent/.env
Copy-Item frontend/.env.example frontend/.env
```

## 2. Start backend

```powershell
cd backend
npm start
```

## 3. Start agent on provider machine

```powershell
cd agent
npm start
```

## 4. Start frontend

```powershell
cd frontend
npm start
```

## 5. Demo flow

1. Create a GPU node setup from the `Provider Onboarding` panel.
2. Download the generated `.env` and setup script.
3. Copy the `agent` folder to the Windows GPU PC and place those files inside it.
4. Run the setup script, then `npm install` and `npm start` in that folder.
5. Confirm the node appears on the dashboard.
6. Submit the `simpleTestJob` or use the dashboard's `Load Local Test` preset.
7. Watch the backend assign the job.
8. Watch logs stream into the dashboard.
9. Confirm the job finishes and result payload is visible.
10. Optionally use `Load Docker Test` to demonstrate Docker execution or automatic local fallback when Docker is unavailable.
