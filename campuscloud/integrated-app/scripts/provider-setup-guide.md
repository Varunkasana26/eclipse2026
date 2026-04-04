# CampusCloud Provider Setup Guide

## Goal

Use this when onboarding a provider machine into the shared workspace demo. The machine does not need a GPU unless you want it to accept jobs with `requires_gpu=true`.

## What the generated package contains

- Worker token
- Backend URL
- Workspace ID
- Node lane
- Node name
- Max allocation percent
- Agent `.env`
- PowerShell setup script

## Provider steps

1. Start the backend first so the generated backend URL is reachable from the provider machine.
2. In the frontend, open the onboarding panel and create a node setup.
3. Download the generated `.env`, setup script, and setup guide.
4. Copy the full `agent/` folder to the provider machine.
5. Place the downloaded `.env` and setup files inside that `agent/` folder.
6. Open PowerShell in the folder and run the setup script if you want it to rewrite `.env` for you.
7. Run `npm install`.
8. Run `npm start`.

## Expected behavior

- The node registers into the exact workspace from the onboarding package.
- The backend marks the node `idle` when heartbeats are fresh and no job is assigned.
- The backend marks the node `busy` as soon as a job is assigned.
- If heartbeats stop for longer than the timeout, the backend marks the node `offline` and fails its active jobs.

## Demo notes

- Non-GPU machines can still run local jobs and chunked jobs that do not require GPU.
- GPU-required jobs only match nodes that report GPU capability and the requested lane.
- Lane matching is strict when a job sends `lane_required`.
- Parent chunk jobs are only trackers; child chunk jobs are the ones assigned to nodes.
