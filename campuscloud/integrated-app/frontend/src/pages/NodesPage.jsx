import React from 'react';
import { Boxes, Layers3 } from 'lucide-react';
import NodeGrid from '../components/NodeGrid';
import OnboardingPanel from '../components/OnboardingPanel';

function NodesPage({
  onboardingForm,
  setOnboardingForm,
  isCreatingNode,
  createNodeError,
  handleCreateNode,
  onboardingItems,
  latestSetup,
  nodes,
  workspaces,
}) {
  return (
    <div className="space-y-6">
      <OnboardingPanel
        form={onboardingForm}
        setForm={setOnboardingForm}
        isCreating={isCreatingNode}
        createError={createNodeError}
        onCreate={handleCreateNode}
        onboardingItems={onboardingItems}
        latestSetup={latestSetup}
      />

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Layers3 className="w-5 h-5 text-cyan-300" />
          <h2 className="text-xl font-semibold">Workspace coverage</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          {workspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400 lg:col-span-3">
              No workspace slots exist yet. A supported provider creates the first workspace when it registers.
            </div>
          ) : (
            workspaces.slice(0, 3).map((workspace) => (
              <div key={workspace.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">{workspace.id}</p>
                <h3 className="text-lg font-semibold mt-2 capitalize">{workspace.status} workspace</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Active jobs {workspace.active_jobs_count || 0} • Usage {workspace.current_usage_percent || 0}%
                </p>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <p>Low lane: <span className="text-slate-100">{workspace.lanes?.low?.node?.name || 'missing'}</span></p>
                  <p>Mid lane: <span className="text-slate-100">{workspace.lanes?.mid?.node?.name || 'missing'}</span></p>
                  <p>High lane: <span className="text-slate-100">{workspace.lanes?.high?.node?.name || 'missing'}</span></p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mt-4 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <Boxes className="w-4 h-4 text-cyan-300" />
            <p className="font-semibold text-slate-100">Why this matters</p>
          </div>
          <p className="mt-3">
            A node is a provider machine running the agent. Once it connects, the backend reads its GPU metadata,
            detects the lane, and assigns it into the first workspace that is missing that slot.
          </p>
        </div>
      </section>

      <NodeGrid nodes={nodes} />
    </div>
  );
}

export default NodesPage;
