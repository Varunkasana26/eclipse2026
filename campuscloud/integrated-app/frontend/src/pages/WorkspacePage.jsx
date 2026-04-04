import React from 'react';
import { Activity, Gauge, Layers3, Server, Users2 } from 'lucide-react';

const laneLabels = {
  low: 'Low lane',
  mid: 'Mid lane',
  high: 'High lane',
};

function WorkspacePage({ workspaces, stats, connectionState }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/85 p-6">
          <p className="text-cyan-300 text-sm font-semibold tracking-[0.18em] uppercase">Workspace Model</p>
          <h2 className="text-3xl font-bold mt-3">Shared GPU pools</h2>
          <p className="text-slate-400 mt-4 max-w-3xl">
            A workspace is a shared compute group made of one low lane node, one mid lane node, and one high lane node.
            Providers join by running the agent. The backend detects their lane, places them into a workspace, and routes jobs inside that pool.
          </p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Workspaces', value: workspaces.length, icon: Layers3 },
              { label: 'Complete Pools', value: stats.completeWorkspaces, icon: Server },
              { label: 'Known Providers', value: stats.nodes, icon: Users2 },
              { label: 'Active Jobs', value: stats.activeJobs, icon: Activity },
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
            <h3 className="text-xl font-semibold">Platform Behavior</h3>
          </div>
          <div className="space-y-3 mt-5 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Realtime state</p>
              <p className="font-semibold mt-2 capitalize">{connectionState}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Node assignment</p>
              <p className="font-semibold mt-2">Backend places each provider into the first workspace missing its lane</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Job routing</p>
              <p className="font-semibold mt-2">Users pick the workspace. The backend chooses the lane, node, and queue timing.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">Capacity policy</p>
              <p className="font-semibold mt-2">Headroom and splitting are internal platform rules, not end-user controls.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-cyan-300 text-sm font-semibold tracking-[0.18em] uppercase">Workspace Inventory</p>
            <h3 className="text-2xl font-semibold mt-2">Lane slots and live usage</h3>
          </div>
          <p className="text-sm text-slate-400 max-w-xl">
            Incomplete workspaces stay visible so operators can see which lane is still missing before the pool becomes complete.
          </p>
        </div>

        <div className="grid xl:grid-cols-2 gap-4 mt-6">
          {workspaces.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 p-6 text-sm text-slate-400 xl:col-span-2">
              No workspaces yet. The first supported provider to connect will create one automatically.
            </div>
          ) : (
            workspaces.map((workspace) => (
              <div key={workspace.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">{workspace.id}</p>
                    <h4 className="text-xl font-semibold mt-2">{workspace.status === 'complete' ? 'Complete workspace' : 'Incomplete workspace'}</h4>
                    <p className="text-sm text-slate-400 mt-2">
                      Usage {workspace.current_usage_percent || 0}% • Active jobs {workspace.active_jobs_count || 0}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    workspace.status === 'complete' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                  }`}>
                    {workspace.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-5 text-sm">
                  {['low', 'mid', 'high'].map((lane) => {
                    const slot = workspace.lanes?.[lane];
                    const node = slot?.node;
                    return (
                      <div key={lane} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-slate-400">{laneLabels[lane]}</p>
                        <p className="font-semibold mt-2">{node?.name || 'Waiting for provider'}</p>
                        <p className="text-slate-400 mt-2">Node ID: {slot?.node_id || 'unfilled'}</p>
                        <p className="text-slate-400 mt-1">State: {node?.availability || 'pending'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default WorkspacePage;
