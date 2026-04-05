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
    <div className="flex flex-col gap-8 bg-transparent min-h-full rounded-3xl relative p-2 scroll-smooth">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes staggerFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      
      <div 
        className="absolute inset-0 z-0 pointer-events-none rounded-3xl"
        style={{ background: 'radial-gradient(circle at top, rgba(0,255,255,0.06), transparent)' }}
      />

      <div className="flex flex-col gap-8 w-full relative z-10">
        <div className="animate-fade-in-up w-full" style={{ animationDelay: '0s' }}>
          <OnboardingPanel
            form={onboardingForm}
            setForm={setOnboardingForm}
            isCreating={isCreatingNode}
            createError={createNodeError}
            onCreate={handleCreateNode}
            onboardingItems={onboardingItems}
            latestSetup={latestSetup}
          />
        </div>

        <section className="animate-fade-in-up w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)] transition-all duration-300 hover:shadow-[0_10px_50px_rgba(0,255,255,0.12)] hover:-translate-y-[5px] hover:border-cyan-400/30" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Layers3 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Workspace coverage</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 w-full">
            {workspaces.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center text-sm font-medium text-slate-300 lg:col-span-3 transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                No workspace slots exist yet. A supported provider creates the first workspace when it registers.
              </div>
            ) : (
              workspaces.slice(0, 3).map((workspace, idx) => (
                <div key={workspace.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-[5px] hover:shadow-[0_10px_40px_rgba(0,255,255,0.15)] hover:border-cyan-400/40 relative overflow-hidden" style={{ animation: 'staggerFadeIn 0.4s ease-out forwards', animationDelay: `${0.2 + idx * 0.1}s`, opacity: 0 }}>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-[40px] pointer-events-none" />
                  <p className="text-sm text-cyan-400 font-bold uppercase tracking-[0.2em]">{workspace.id}</p>
                  <h3 className="text-xl font-bold mt-2 text-white capitalize flex items-center gap-2">
                    {workspace.status} workspace
                    {workspace.status === 'complete' && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />}
                    {workspace.status === 'incomplete' && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />}
                  </h3>
                  <p className="text-sm text-cyan-200/80 font-medium mt-3 pb-4 border-b border-white/10">
                    Active jobs: <span className="text-white font-bold">{workspace.active_jobs_count || 0}</span> • Usage: <span className="text-white font-bold">{workspace.current_usage_percent || 0}%</span>
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-400 font-medium">
                    <p className="flex justify-between items-center"><span className="text-slate-300">Low lane:</span> <span className={`px-2 py-1 rounded-md bg-black/30 border border-white/5 ${workspace.lanes?.low?.node?.name ? 'text-cyan-300' : 'text-slate-500'}`}>{workspace.lanes?.low?.node?.name || 'missing'}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-300">Mid lane:</span> <span className={`px-2 py-1 rounded-md bg-black/30 border border-white/5 ${workspace.lanes?.mid?.node?.name ? 'text-cyan-300' : 'text-slate-500'}`}>{workspace.lanes?.mid?.node?.name || 'missing'}</span></p>
                    <p className="flex justify-between items-center"><span className="text-slate-300">High lane:</span> <span className={`px-2 py-1 rounded-md bg-black/30 border border-white/5 ${workspace.lanes?.high?.node?.name ? 'text-cyan-300' : 'text-slate-500'}`}>{workspace.lanes?.high?.node?.name || 'missing'}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6 mt-6 text-sm text-cyan-100/80 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] hover:border-cyan-400/40 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent w-[200%] translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />
            <style>{`
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
            `}</style>
            <div className="flex items-center gap-3 relative z-10 mb-3">
              <Boxes className="w-5 h-5 text-cyan-400" />
              <p className="font-bold text-white text-base tracking-wide">Why this matters</p>
            </div>
            <p className="leading-relaxed relative z-10 max-w-4xl text-slate-300">
              A node is a provider machine running the agent. Once it connects, the backend reads its GPU metadata,
              detects the lane, and assigns it into the first workspace that is missing that slot.
            </p>
          </div>
        </section>

        <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
          <NodeGrid nodes={nodes} />
        </div>
      </div>
    </div>
  );
}

export default NodesPage;
