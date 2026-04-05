import React from 'react';
import { Download, KeyRound, MonitorSmartphone, PlugZap, Check } from 'lucide-react';

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
  const isConnected = status === 'connected' || status === 'active';
  const tone = isConnected
    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
    : 'bg-amber-500/10 text-amber-300 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.4)]';

  return <span className={`text-xs font-bold px-3 py-1 rounded-full ${tone}`}>{status}</span>;
}

function OnboardingPanel({ form, setForm, isCreating, createError, onCreate, onboardingItems, latestSetup }) {
  const btnClass = "inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 text-slate-100 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40 active:bg-gradient-to-r active:from-cyan-500/20 active:to-blue-500/20 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none";
  const inputClass = "w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-slate-100 outline-none backdrop-blur-md transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40";
  const glassCardClass = "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_10px_50px_rgba(0,255,255,0.12)] hover:border-cyan-400/30 backdrop-blur-xl relative overflow-hidden group";
  const innerGlassClass = "rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,255,255,0.12)] hover:border-cyan-400/40 relative overflow-hidden";

  return (
    <div className={glassCardClass}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 w-full">
        <div className="flex-1">
          <p className="text-cyan-400 text-sm font-semibold tracking-[0.18em] uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">Provider Onboarding</p>
          <h2 className="text-2xl font-bold mt-2 text-white">Connect a provider machine by running the agent</h2>
          <p className="text-slate-400 mt-3 max-w-2xl text-sm leading-relaxed">
            Create a node invite, generate the agent `.env`, then copy the `agent` folder to the provider machine.
            After the agent connects, the backend detects GPU capability, assigns the node to a lane, and places it into a workspace automatically.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 px-5 py-4 text-sm text-cyan-50 min-w-[200px] shadow-[0_0_20px_rgba(0,255,255,0.1)] backdrop-blur-md">
          <p className="font-bold text-cyan-300 mb-3 border-b border-cyan-500/30 pb-2">Best path</p>
          <p className="mt-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold border border-cyan-500/40">1</span> Create node</p>
          <p className="mt-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold border border-cyan-500/40">2</span> Download files</p>
          <p className="mt-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold border border-cyan-500/40">3</span> Run on provider</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full">
        <form className="space-y-6 bg-black/20 rounded-3xl p-6 border border-white/5" onSubmit={onCreate}>
          <label className="block w-full">
            <span className="block text-sm text-slate-300 mb-2 font-medium">Node Name</span>
            <input
              value={form.workerName}
              onChange={(event) => setForm((current) => ({ ...current, workerName: event.target.value }))}
              className={inputClass}
              placeholder="Varun GPU Laptop"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-6 w-full">
            <label className="block w-full">
              <span className="block text-sm text-slate-300 mb-2 font-medium">Owner or Team Name</span>
              <input
                value={form.ownerName}
                onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))}
                className={inputClass}
                placeholder="CampusCloud Lab"
              />
            </label>
            <label className="block w-full">
              <span className="block text-sm text-slate-300 mb-2 font-medium">Tags</span>
              <input
                value={form.tagsText}
                onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
                className={inputClass}
                placeholder="windows,gpu,cuda,hackathon"
              />
            </label>
          </div>

          <label className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 cursor-pointer transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] group">
            <div className="relative flex items-center justify-center w-6 h-6">
              <input
                type="checkbox"
                checked={form.allowDocker}
                onChange={(event) => setForm((current) => ({ ...current, allowDocker: event.target.checked }))}
                className="peer absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-full rounded-md border-2 border-white/20 bg-black/40 transition-all duration-300 peer-checked:bg-cyan-500 peer-checked:border-cyan-400 peer-focus:shadow-[0_0_15px_rgba(0,255,255,0.5)] flex items-center justify-center group-hover:border-cyan-400/60">
                <Check className="w-4 h-4 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity duration-300" strokeWidth={4} />
              </div>
            </div>
            <span className="text-sm text-slate-200 font-medium group-hover:text-white transition-colors">Allow Docker on this provider</span>
          </label>

          {createError ? (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)] backdrop-blur-md font-medium">
              {createError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-white font-bold px-8 py-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:from-cyan-400/30 hover:to-blue-400/30 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            {isCreating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating node...</span>
              </>
            ) : (
              <>
                <PlugZap className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <span>Create Node Setup</span>
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-8 w-full">
          <div className={`${innerGlassClass} !p-6 border-cyan-500/20 shadow-[0_0_30px_rgba(0,255,255,0.05)]`}>
            <div className="flex items-center gap-3 mb-6">
              <MonitorSmartphone className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Latest setup package</h3>
            </div>
            {!latestSetup ? (
              <p className="text-sm text-slate-400 bg-black/20 p-5 rounded-2xl border border-white/5">
                Create a node setup to generate a unique worker token and agent `.env`.
              </p>
            ) : (
              <div className="space-y-6 text-sm">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={innerGlassClass}>
                    <p className="text-slate-400 font-medium">Worker ID</p>
                    <p className="font-bold mt-2 text-white">{latestSetup.workerId}</p>
                  </div>
                  <div className={innerGlassClass}>
                    <p className="text-slate-400 font-medium">Node name</p>
                    <p className="font-bold mt-2 text-white">{latestSetup.nodeName || latestSetup.workerName}</p>
                  </div>
                  <div className={innerGlassClass}>
                    <p className="text-slate-400 font-medium">Backend URL</p>
                    <p className="font-bold mt-2 break-all text-white">{latestSetup.backendUrl}</p>
                  </div>
                  <div className={innerGlassClass}>
                    <p className="text-slate-400 font-medium">Assignment mode</p>
                    <p className="font-bold mt-2 text-white">Automatic <span className="text-cyan-400">⚡</span></p>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-5 shadow-[0_0_25px_rgba(0,255,255,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 blur-[50px]" />
                  <div className="flex items-center gap-2 text-cyan-300 relative z-10">
                    <KeyRound className="w-5 h-5" />
                    <span className="font-bold text-base tracking-wide">WORKER TOKEN GENERATED</span>
                  </div>
                  <p className="text-slate-100 font-mono mt-3 break-all relative z-10 bg-black/30 p-3 rounded-xl border border-cyan-500/20 shadow-inner">
                    {latestSetup.workerToken}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button type="button" onClick={() => downloadTextFile(latestSetup.envFile.fileName, latestSetup.envFile.content)} className={btnClass}>
                    <Download className="w-4 h-4" /> Download Agent .env
                  </button>
                  <button type="button" onClick={() => downloadTextFile(latestSetup.setupScript.fileName, latestSetup.setupScript.content)} className={btnClass}>
                    <Download className="w-4 h-4 text-cyan-300" /> Download Setup Script
                  </button>
                  {latestSetup.setupGuide ? (
                    <button type="button" onClick={() => downloadTextFile(latestSetup.setupGuide.fileName, latestSetup.setupGuide.content)} className={btnClass}>
                      <Download className="w-4 h-4 text-blue-300" /> Download Setup Guide
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className={`${innerGlassClass} !p-6`}>
            <h3 className="text-xl font-bold mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Onboarding status</h3>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {onboardingItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-sm text-slate-400 text-center font-medium bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]">
                  No onboarding records yet. Awaiting fresh nodes.
                </div>
              ) : (
                onboardingItems.map((item, idx) => (
                  <div key={item.workerId} className={`${innerGlassClass} hover:border-cyan-500/50 hover:shadow-[0_5px_25px_rgba(0,255,255,0.2)]`} style={{ animation: 'staggerFadeIn 0.3s ease-out forwards', animationDelay: `${idx * 0.1}s`, opacity: 0 }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{item.workerName}</p>
                        <p className="text-xs text-cyan-400/70 font-mono mt-1">{item.workerId}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <p className="text-xs text-slate-400"><span className="text-slate-500">Workspace:</span> <span className="text-slate-200">{item.assignedWorkspaceId || item.workspaceId || 'pending auto-assign'}</span></p>
                      <p className="text-xs text-slate-400"><span className="text-slate-500">Lane:</span> <span className={`${item.detectedLane || item.lane ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>{item.detectedLane || item.lane || 'pending detection'}</span></p>
                      <p className="text-xs text-slate-400"><span className="text-slate-500">Docker:</span> <span className={`${item.allowDocker ? 'text-emerald-400' : 'text-rose-400'}`}>{item.allowDocker ? 'enabled' : 'disabled'}</span></p>
                      <p className="text-xs text-slate-400 truncate" title={(item.tags || []).join(', ') || 'none'}><span className="text-slate-500">Tags:</span> <span className="text-slate-200">{(item.tags || []).join(', ') || 'none'}</span></p>
                    </div>
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
