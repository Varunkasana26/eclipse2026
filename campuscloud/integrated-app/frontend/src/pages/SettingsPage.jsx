import React from 'react';
import { Info, SlidersHorizontal } from 'lucide-react';

function SettingsPage({ workspaces, nodes, jobs, connectionState }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center gap-3 mb-5">
          <SlidersHorizontal className="w-5 h-5 text-cyan-300" />
          <h2 className="text-xl font-semibold">Platform policy</h2>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="font-semibold text-slate-100">Backend-managed scheduling</p>
            <p className="mt-2">
              Scheduling, lane assignment, capacity limits, and workload splitting are managed automatically by the backend.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="font-semibold text-slate-100">Node placement</p>
            <p className="mt-2">
              When a provider joins, the backend classifies it into low, mid, or high and assigns it to the first workspace missing that lane.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="font-semibold text-slate-100">User-facing controls removed</p>
            <p className="mt-2">
              GPU utilization caps, max users, split mode, and chunk fan-out are no longer editable from the console.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-cyan-300" />
          <h2 className="text-xl font-semibold">System snapshot</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Realtime state</p>
            <p className="text-3xl font-bold mt-2 capitalize">{connectionState}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Workspaces</p>
            <p className="text-3xl font-bold mt-2">{workspaces.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Providers</p>
            <p className="text-3xl font-bold mt-2">{nodes.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Jobs tracked</p>
            <p className="text-3xl font-bold mt-2">{jobs.length}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mt-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Product language</p>
          <p className="mt-3">Node = provider machine running the agent.</p>
          <p className="mt-1">Workspace = shared GPU group with low, mid, and high lanes.</p>
          <p className="mt-1">Job = compute request submitted to a workspace.</p>
          <p className="mt-1">Backend = chooses machines and manages capacity.</p>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
