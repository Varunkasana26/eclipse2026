import React from 'react';
import { Boxes, Layers3 } from 'lucide-react';
import NodeGrid from '../components/NodeGrid';
import OnboardingPanel from '../components/OnboardingPanel';

function NodesPage({
  workspace,
  onboardingForm,
  setOnboardingForm,
  isCreatingNode,
  createNodeError,
  handleCreateNode,
  onboardingItems,
  latestSetup,
  nodes,
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
          <h2 className="text-xl font-semibold">Workspace lane coverage</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          {workspace.lanes.map((lane) => (
            <div key={lane.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">{lane.label}</p>
              <h3 className="text-lg font-semibold mt-2">{lane.role}</h3>
              <p className="text-sm text-slate-400 mt-2">{lane.rangeLabel}</p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p>Primary node: <span className="text-slate-100">{lane.node?.name || 'Awaiting provider'}</span></p>
                <p>Candidate providers: <span className="text-slate-100">{lane.candidateCount}</span></p>
                <p>Reserved headroom: <span className="text-slate-100">{lane.reservePercent}%</span></p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mt-4 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <Boxes className="w-4 h-4 text-cyan-300" />
            <p className="font-semibold text-slate-100">Why this matters</p>
          </div>
          <p className="mt-3">
            Each workspace should eventually guarantee one low-tier, one mid-tier, and one high-tier GPU so users with
            smaller workloads are not blocked by large jobs. Until dedicated GPU providers join, connected CPU-only or
            unclassified machines remain visible below as staging providers.
          </p>
        </div>
      </section>

      <NodeGrid nodes={nodes} />
    </div>
  );
}

export default NodesPage;
