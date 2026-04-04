import React from 'react';
import { Cpu, Server } from 'lucide-react';

function formatTime(value) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

function formatFreshness(ageMs) {
  if (!Number.isFinite(ageMs)) {
    return 'unknown';
  }

  if (ageMs < 1000) {
    return 'just now';
  }

  const seconds = Math.round(ageMs / 1000);
  return `${seconds}s ago`;
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
            <div key={node.node_id || node.nodeId} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{node.name || node.node_id}</p>
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
                <p>Online: <span className="text-slate-100">{node.online ? 'yes' : 'no'}</span></p>
                <p>Availability: <span className="text-slate-100">{node.availability || node.status}</span></p>
                <p>Workspace: <span className="text-slate-100">{node.workspace_id || 'unassigned'}</span></p>
                <p>Lane: <span className="text-slate-100 uppercase">{node.lane || node.lane_status || 'unsupported'}</span></p>
                <p>GPU available: <span className="text-slate-100">{node.gpu_available ? 'yes' : 'no'}</span></p>
                <p>GPU name: <span className="text-slate-100">{node.gpu_name || 'n/a'}</span></p>
                <p>VRAM: <span className="text-slate-100">{node.vram_mb ? `${(node.vram_mb / 1024).toFixed(1)} GB` : 'n/a'}</span></p>
                <p>Docker ready: <span className="text-slate-100">{node.docker_ready ? 'yes' : 'no'}</span></p>
                <p>Backend usage: <span className="text-slate-100">{node.current_alloc_percent || 0}%</span></p>
                <p>Utilization: <span className="text-slate-100">{node.utilization_percent || 0}%</span></p>
                <p>Queue depth: <span className="text-slate-100">{node.current_queue_depth || 0}</span></p>
                <p>Current job: <span className="text-slate-100">{node.current_job_id || 'none'}</span></p>
                <p>Heartbeat freshness: <span className="text-slate-100">{formatFreshness(node.heartbeat_age_ms)}</span></p>
                <p>Last heartbeat: <span className="text-slate-100">{formatTime(node.last_heartbeat || node.lastHeartbeatAt)}</span></p>
                {node.offline_reason ? (
                  <p>Offline reason: <span className="text-rose-300">{node.offline_reason}</span></p>
                ) : null}
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

