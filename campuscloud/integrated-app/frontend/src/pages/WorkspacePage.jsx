import React from 'react';
import { Activity, Gauge, Layers3, Server, Users2, Boxes } from 'lucide-react';

const laneLabels = {
  low: 'Low lane',
  mid: 'Mid lane',
  high: 'High lane',
};

function WorkspacePage({ workspaces, stats, connectionState }) {
  return (
    <div className="flex flex-col gap-8 bg-transparent min-h-full rounded-3xl relative p-2 scroll-smooth">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
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
        
        <section className="hover-tilt reveal-on-scroll animate-fade-in-up relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)]" style={{ animationDelay: '0s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Layers3 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Workspace Model & Behavior</h2>
          </div>
          <p className="text-slate-300 mt-4 max-w-3xl leading-relaxed">
            A workspace is a shared compute group made of one low lane node, one mid lane node, and one high lane node.
            Providers join by running the agent. The backend detects their lane, places them into a workspace, and routes jobs inside that pool.
          </p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Workspaces', value: workspaces.length, icon: Layers3 },
              { label: 'Complete Pools', value: stats.completeWorkspaces, icon: Server },
              { label: 'Known Providers', value: stats.nodes, icon: Users2 },
              { label: 'Active Jobs', value: stats.activeJobs, icon: Activity },
            ].map((item, i) => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_50px_rgba(0,255,255,0.12)] hover:-translate-y-1 hover:brightness-110 group animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <item.icon className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-400">{item.label}</p>
                <p className="text-3xl font-bold mt-2 text-white">{item.value}</p>
              </div>
            ))}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)]">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-cyan-300" />
                <p className="font-semibold text-slate-100">Live Backend State</p>
              </div>
              <p className="font-bold text-2xl text-cyan-400 capitalize mt-3">{connectionState}</p>
              <p className="text-sm text-slate-400 mt-2">Node Assignment: Backend places each provider automatically.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)]">
              <div className="flex items-center gap-3">
                <Boxes className="w-5 h-5 text-cyan-300" />
                <p className="font-semibold text-slate-100">Routing Policy</p>
              </div>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Users simply select a workspace. The backend automatically determines the appropriate lane, machine, and queuing rules. Headroom and splitting are strictly internal.
              </p>
            </div>
          </div>
        </section>

        <section className="hover-tilt reveal-on-scroll animate-fade-in-up relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)]" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Workspace inventory</h2>
              <p className="text-sm text-slate-400 max-w-xl mt-2 leading-relaxed">
                Incomplete workspaces stay visible so operators can see which lane is still missing before the pool becomes complete.
              </p>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-4 mt-6">
            {workspaces.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-black/20 p-8 text-center text-sm font-medium text-slate-300 xl:col-span-2 shadow-inner">
                No workspaces yet. The first supported provider to connect will create one automatically.
              </div>
            ) : (
              workspaces.map((workspace, idx) => (
                <div key={workspace.id} className="animate-fade-in-up rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,255,255,0.15)] hover:border-cyan-400/40 relative overflow-hidden group" style={{ animationDelay: `${0.2 + idx * 0.1}s` }}>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-400/20 transition-colors" />
                  
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-cyan-400 font-bold uppercase tracking-[0.2em] drop-[0_0_8px_rgba(0,255,255,0.8)]">{workspace.id}</p>
                      <h4 className="text-xl font-bold mt-2 text-white">{workspace.status === 'complete' ? 'Complete workspace' : 'Incomplete workspace'}</h4>
                      <p className="text-sm text-slate-400 font-medium mt-2">
                        Usage <span className="text-white">{workspace.current_usage_percent || 0}%</span> • Active jobs <span className="text-white">{workspace.active_jobs_count || 0}</span>
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                      workspace.status === 'complete' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    }`}>
                      {workspace.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mt-6 text-sm">
                    {['low', 'mid', 'high'].map((lane) => {
                      const slot = workspace.lanes?.[lane];
                      const node = slot?.node;
                      return (
                        <div key={lane} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/40 hover:-translate-y-[2px] hover:shadow-[0_4px_15px_rgba(0,255,255,0.1)] group/lane relative overflow-hidden">
                          <p className="text-slate-400 font-semibold">{laneLabels[lane]}</p>
                          <p className={`font-bold mt-2 ${node?.name ? 'text-cyan-300' : 'text-slate-500'}`}>{node?.name || 'Waiting for provider'}</p>
                          <p className="text-xs text-slate-400 font-medium mt-2 truncate w-full" title={slot?.node_id || 'unfilled'}>ID: {slot?.node_id || 'unfilled'}</p>
                          <p className="text-xs text-slate-400 font-medium mt-1">State: <span className={node?.availability === 'active' ? 'text-emerald-400 font-bold' : ''}>{node?.availability || 'pending'}</span></p>
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
    </div>
  );
}

export default WorkspacePage;
