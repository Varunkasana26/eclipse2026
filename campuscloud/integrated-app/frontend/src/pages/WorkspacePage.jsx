import React from 'react';
import { Activity, Gauge, Layers3, ShieldCheck, Users2 } from 'lucide-react';

function WorkspacePage({ workspace, stats, settings, connectionState }) {
  const reservePercent = Math.max(0, 100 - settings.utilizationCapPercent);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/85 p-6">
          <p className="text-cyan-300 text-sm font-semibold tracking-[0.18em] uppercase">Workspace Model</p>
          <h2 className="text-3xl font-bold mt-3">{settings.workspaceName}</h2>
          <p className="text-slate-400 mt-4 max-w-3xl">
            Low-end users join a shared workspace instead of selecting raw machines. Each workspace is designed
            around three GPU lanes: low, mid, and high. The scheduler should keep only {settings.utilizationCapPercent}% of each
            GPU budget allocatable so burst traffic and extra task chunks still have headroom.
          </p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Joined Providers', value: stats.nodes, icon: Users2 },
              { label: 'Ready GPU Lanes', value: workspace.readyLaneCount, icon: Layers3 },
              { label: 'Queued Chunks', value: workspace.queuedChunkCount, icon: Activity },
              { label: 'Reserve Buffer', value: `${reservePercent}%`, icon: ShieldCheck },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <item.icon className="w-5 h-5 text-cyan-300" />
                <p className="text-sm text-slate-400 mt-3">{item.label}</p>
                <p className="text-3xl font-bold mt-2">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/85 p-6">
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5 text-cyan-300" />
            <h3 className="text-xl font-semibold">Control Rules</h3>
          </div>
          <div className="space-y-3 mt-5 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Scheduler target</p>
              <p className="font-semibold mt-2">Assign the best-fit GPU lane inside the workspace</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Utilization cap</p>
              <p className="font-semibold mt-2">{settings.utilizationCapPercent}% max allocatable per GPU</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Split mode</p>
              <p className="font-semibold mt-2">{settings.splitMode}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Realtime state</p>
              <p className="font-semibold mt-2 capitalize">{connectionState}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-cyan-300 text-sm font-semibold tracking-[0.18em] uppercase">Three-Lane Workspace</p>
            <h3 className="text-2xl font-semibold mt-2">Low, mid, and high GPU slots</h3>
          </div>
          <p className="text-sm text-slate-400 max-w-xl">
            This is the product contract exposed to users. Jobs come into the workspace, get split into chunks when needed,
            and the scheduler places those chunks across the correct GPU lane while preserving reserve capacity.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-6">
          {workspace.lanes.map((lane) => (
            <div key={lane.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">{lane.label}</p>
                  <h4 className="text-xl font-semibold mt-2">{lane.role}</h4>
                  <p className="text-sm text-slate-400 mt-2">{lane.rangeLabel}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  lane.node ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {lane.node ? 'ready' : 'waiting'}
                </span>
              </div>

              <div className="space-y-3 mt-5 text-sm">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-slate-400">Assigned provider</p>
                  <p className="font-semibold mt-2">{lane.node?.name || 'No GPU provider connected yet'}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-slate-400">Planner budget</p>
                  <p className="font-semibold mt-2">
                    {lane.capPercent}% active allocation / {lane.reservePercent}% reserve
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-slate-400">Recommended workloads</p>
                  <p className="font-semibold mt-2">{lane.workloadLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-slate-400">Chunk strategy</p>
                  <p className="font-semibold mt-2">{lane.chunkLabel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default WorkspacePage;
