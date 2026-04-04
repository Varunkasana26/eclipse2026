import React from 'react';
import { Download, KeyRound, MonitorSmartphone, PlugZap } from 'lucide-react';

function downloadTextFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function StatusPill({ status }) {
  const tone =
    status === 'connected'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'offline'
        ? 'bg-amber-500/15 text-amber-300'
        : 'bg-slate-700 text-slate-200';

  return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tone}`}>{status}</span>;
}

function OnboardingPanel({ form, setForm, isCreating, createError, onCreate, onboardingItems, latestSetup }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-cyan-300 text-sm font-semibold tracking-[0.18em] uppercase">Provider Onboarding</p>
          <h2 className="text-xl font-semibold mt-2">Connect a provider machine by running the agent</h2>
          <p className="text-slate-400 mt-3 max-w-2xl text-sm">
            Create a node invite, generate the agent `.env`, then copy the `agent` folder to the provider machine.
            After the agent connects, the backend detects GPU capability, assigns the node to a lane, and places it into a workspace automatically.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Best path</p>
          <p className="mt-2">1. Create node</p>
          <p>2. Download files</p>
          <p>3. Run on provider</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <form className="space-y-4" onSubmit={onCreate}>
          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Node Name</span>
            <input
              value={form.workerName}
              onChange={(event) => setForm((current) => ({ ...current, workerName: event.target.value }))}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="Varun GPU Laptop"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm text-slate-300 mb-2">Owner or Team Name</span>
              <input
                value={form.ownerName}
                onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))}
                className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                placeholder="CampusCloud Lab"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Tags</span>
            <input
              value={form.tagsText}
              onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="windows,gpu,cuda,hackathon"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3">
            <input
              type="checkbox"
              checked={form.allowDocker}
              onChange={(event) => setForm((current) => ({ ...current, allowDocker: event.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-900"
            />
            <span className="text-sm text-slate-300">Allow Docker on this provider</span>
          </label>

          {createError ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {createError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 text-slate-950 font-semibold px-5 py-3 disabled:opacity-60"
          >
            <PlugZap className="w-4 h-4" />
            {isCreating ? 'Creating node...' : 'Create Node Setup'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center gap-3 mb-4">
              <MonitorSmartphone className="w-5 h-5 text-cyan-300" />
              <h3 className="text-lg font-semibold">Latest setup package</h3>
            </div>
            {!latestSetup ? (
              <p className="text-sm text-slate-400">
                Create a node setup to generate a unique worker token and agent `.env`.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-slate-400">Worker ID</p>
                    <p className="font-semibold mt-2">{latestSetup.workerId}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-slate-400">Node name</p>
                    <p className="font-semibold mt-2">{latestSetup.nodeName || latestSetup.workerName}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-slate-400">Backend URL</p>
                    <p className="font-semibold mt-2 break-all">{latestSetup.backendUrl}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-slate-400">Assignment mode</p>
                    <p className="font-semibold mt-2">Automatic on first connect</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <KeyRound className="w-4 h-4" />
                    <span className="font-semibold">Worker token generated</span>
                  </div>
                  <p className="text-slate-300 mt-2 break-all">{latestSetup.workerToken}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => downloadTextFile(latestSetup.envFile.fileName, latestSetup.envFile.content)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
                  >
                    <Download className="w-4 h-4" />
                    Download Agent .env
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(latestSetup.setupScript.fileName, latestSetup.setupScript.content)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
                  >
                    <Download className="w-4 h-4" />
                    Download Setup Script
                  </button>
                  {latestSetup.setupGuide ? (
                    <button
                      type="button"
                      onClick={() => downloadTextFile(latestSetup.setupGuide.fileName, latestSetup.setupGuide.content)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
                    >
                      <Download className="w-4 h-4" />
                      Download Setup Guide
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold mb-4">Onboarding status</h3>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {onboardingItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No onboarding records yet.
                </div>
              ) : (
                onboardingItems.map((item) => (
                  <div key={item.workerId} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.workerName}</p>
                        <p className="text-sm text-slate-400 mt-1">{item.workerId}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="text-sm text-slate-400 mt-3">Workspace: {item.assignedWorkspaceId || item.workspaceId || 'pending automatic assignment'}</p>
                    <p className="text-sm text-slate-400 mt-1">Lane: {item.detectedLane || item.lane || 'pending detection'}</p>
                    <p className="text-sm text-slate-400 mt-1">Docker: {item.allowDocker ? 'enabled' : 'disabled'}</p>
                    <p className="text-sm text-slate-400 mt-1">Tags: {(item.tags || []).join(', ') || 'none'}</p>
                    <p className="text-sm text-slate-400 mt-1">Backend: {item.backendUrl}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPanel;

