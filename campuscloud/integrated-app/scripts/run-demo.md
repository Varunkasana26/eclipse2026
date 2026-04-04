# Run Demo

## 1. Start backend

```powershell
cd campuscloud\integrated-app\backend
Copy-Item .env.example .env
npm install
npm start
```

## 2. Start agent on provider machine

```powershell
cd campuscloud\integrated-app\agent
Copy-Item .env.example .env
npm install
npm start
```

## 3. Start frontend

```powershell
cd campuscloud\integrated-app\frontend
Copy-Item .env.example .env
npm install
npm start
```

## 4. Demo flow

1. Confirm the node appears on the dashboard.
2. Submit the `localDemoJob` from `shared/sampleJobPayloads.json`.
3. Watch the backend assign the job.
4. Watch logs stream into the dashboard.
5. Confirm the job finishes and result payload is visible.
