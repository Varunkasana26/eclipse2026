import React from 'react';
import { Cpu, Server } from 'lucide-react';

function formatTime(value) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

function NodeGrid({ nodes }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <Server className="w-5 h-5 text-cyan-300" />
        <h2 className="text-xl font-semibold">Available Providers</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {nodes.length === 0 ? (
          <div className="text-slate-400 border border-dashed border-slate-700 rounded-2xl p-5">
            No agents registered yet.
          </div>
        ) : (
          nodes.map((node) => (
            <div key={node.nodeId} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{node.name || node.nodeId}</p>
                  <p className="text-sm text-slate-400 mt-1">{node.hostname}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  node.status === 'idle'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : node.status === 'busy'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                }`}>
                  {node.status}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Executor: <span className="text-slate-100">{node.executorMode}</span></p>
                <p>GPU: <span className="text-slate-100">{node.gpuSummary}</span></p>
                <p>RAM: <span className="text-slate-100">{node.ram?.total_gb || 0} GB</span></p>
                <p>Last heartbeat: <span className="text-slate-100">{formatTime(node.lastHeartbeatAt)}</span></p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Cpu className="w-4 h-4" />
                <span>{node.platform} / {node.arch}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NodeGrid;
