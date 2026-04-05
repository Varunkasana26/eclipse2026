import React from 'react';
import { Boxes, CircleDollarSign, Cpu, Settings2, Workflow } from 'lucide-react';

const navItems = [
  { id: 'workspace', label: 'Workspace', icon: Boxes },
  { id: 'nodes', label: 'Nodes', icon: Cpu },
  { id: 'jobs', label: 'Jobs', icon: Workflow },
  { id: 'tokenomics', label: 'Tokenomics', icon: CircleDollarSign },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

function ConsoleNav({ activeView, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {navItems.map((item) => {
        const selected = item.id === activeView;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
              selected
                ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] backdrop-blur-xl'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] hover:text-white backdrop-blur-md'
            }`}
          >
            <item.icon className={`w-4 h-4 ${selected ? 'animate-pulse drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : ''}`} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default ConsoleNav;
