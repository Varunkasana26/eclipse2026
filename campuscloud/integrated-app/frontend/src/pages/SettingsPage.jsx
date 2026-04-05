import React from 'react';
import { Info, SlidersHorizontal } from 'lucide-react';

function SettingsPage({ workspaces, nodes, jobs, connectionState }) {
  return (
    <div className="flex flex-col gap-8 bg-transparent min-h-full rounded-3xl relative p-2">
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
      
      {/* Platform policy */}
      <section className="animate-fade-in-up relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)]" style={{ animationDelay: '0s' }}>
        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Platform policy</h2>
        </div>

        <div className="space-y-4 text-sm text-gray-400">
          <div className="animate-fade-in-up bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] hover:scale-105 hover:brightness-110 hover:-translate-y-[5px]" style={{ animationDelay: '0.1s' }}>
            <p className="font-semibold text-white">Backend-managed scheduling</p>
            <p className="mt-2">
              Scheduling, lane assignment, capacity limits, and workload splitting are managed automatically by the backend.
            </p>
          </div>
          <div className="animate-fade-in-up bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] hover:scale-105 hover:brightness-110 hover:-translate-y-[5px]" style={{ animationDelay: '0.2s' }}>
            <p className="font-semibold text-white">Node placement</p>
            <p className="mt-2">
              When a provider joins, the backend classifies it into low, mid, or high and assigns it to the first workspace missing that lane.
            </p>
          </div>
          <div className="animate-fade-in-up bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] hover:scale-105 hover:brightness-110 hover:-translate-y-[5px]" style={{ animationDelay: '0.3s' }}>
            <p className="font-semibold text-white">User-facing controls removed</p>
            <p className="mt-2">
              GPU utilization caps, max users, split mode, and chunk fan-out are no longer editable from the console.
            </p>
          </div>
        </div>
      </section>

      {/* System snapshot */}
      <section className="animate-fade-in-up relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)]" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">System snapshot</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Realtime state', value: connectionState, isCapitalize: true },
            { label: 'Workspaces', value: workspaces.length },
            { label: 'Providers', value: nodes.length },
            { label: 'Jobs tracked', value: jobs.length }
          ].map((stat, i) => (
            <div 
              key={stat.label} 
              className="animate-fade-in-up bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-center items-center text-center transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_50px_rgba(0,255,255,0.12)] hover:scale-105 hover:brightness-110 hover:-translate-y-[5px]"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <p className="text-sm font-medium text-gray-400">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 text-white ${stat.isCapitalize ? 'capitalize' : ''}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-in-up bg-white/5 border border-white/10 rounded-2xl p-5 mt-6 text-sm text-gray-400 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] hover:scale-105 hover:brightness-110 hover:-translate-y-[5px]" style={{ animationDelay: '0.8s' }}>
          <p className="font-semibold text-white">Product language</p>
          <div className="mt-3 space-y-2">
            <p>Node = provider machine running the agent.</p>
            <p>Workspace = shared GPU group with low, mid, and high lanes.</p>
            <p>Job = compute request submitted to a workspace.</p>
            <p>Backend = chooses machines and manages capacity.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
