import React from 'react';
import { Boxes, Cpu, Settings2, Workflow } from 'lucide-react';

const navItems = [
  { id: 'workspace', label: 'Workspace', icon: Boxes },
  { id: 'nodes', label: 'Nodes', icon: Cpu },
  { id: 'jobs', label: 'Jobs', icon: Workflow },
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
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              selected
                ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                : 'border-slate-800 bg-slate-900/90 text-slate-200'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default ConsoleNav;
