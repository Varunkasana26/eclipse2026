import React, { useState } from 'react';
import { Cpu, Server, Search, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

function formatTime(value) {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
}

<<<<<<< HEAD
function VramBar({ ram }) {
  const total = ram?.total_gb || 0;
  // Visual representation of RAM capacity
  const percentage = total > 0 ? 100 : 0; 
  
=======
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
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
        <span>System RAM / VRAM</span>
        <span className="text-space-accent">{total} GB</span>
      </div>
      <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-space-accent/10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full bg-space-accent opacity-80 rounded-full"
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8 relative"
      >
        <svg width="84" height="84" viewBox="0 0 24 24" fill="none" className="text-space-accent opacity-70">
          <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 9h6v6H9V9z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1"/>
          <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <motion.div 
          className="absolute inset-0 bg-space-accent blur-2xl rounded-full mix-blend-screen"
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-200 font-sans mb-2 tracking-wide">Waiting for nodes to register...</h3>
      <p className="text-sm text-slate-500 max-w-sm font-sans">No GPU providers are currently connected to this workspace cluster.</p>
    </div>
  );
}

function NodeGrid({ nodes }) {
  const [search, setSearch] = useState('');

  const filteredNodes = nodes.filter(node => 
    (node.name || node.nodeId).toLowerCase().includes(search.toLowerCase()) ||
    (node.hostname || '').toLowerCase().includes(search.toLowerCase()) ||
    (node.gpuSummary || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-black/60 backdrop-blur-xl border-t border-l border-blue-500/40 border-b border-r border-purple-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.3)] hover:border-blue-400/60 hover:scale-[1.01] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] rounded-2xl p-6 transition-all duration-300 relative group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-space-accent" />
          <h2 className="text-xl font-semibold font-sans text-white">Available Providers</h2>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search nodes or GPUs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/50 border border-space-accent/20 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-space-accent focus:shadow-[0_0_10px_rgba(0,85,255,0.2)] transition-all font-mono w-full sm:w-64"
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row flex-wrap gap-4 min-h-[280px] content-start">
        {nodes.length === 0 ? (
          <EmptyState />
        ) : filteredNodes.length === 0 ? (
           <div className="col-span-full py-12 text-center text-slate-500 font-mono">No nodes match your active filter.</div>
        ) : (
<<<<<<< HEAD
          filteredNodes.map((node) => (
            <motion.div 
              key={node.nodeId} 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex-1 min-w-[min(100%,240px)] bg-neutral-900/40 border border-space-accent/20 shadow-sm rounded-xl p-5 cursor-pointer hover:shadow-lg hover:shadow-space-accent/20 hover:border-space-accent/40 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-2.5 h-2.5 mt-0.5">
                    <span className={`absolute flex h-full w-full rounded-full opacity-75 animate-ping ${node.status === 'idle' ? 'bg-emerald-400' : node.status === 'busy' ? 'bg-amber-400' : 'bg-slate-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${node.status === 'idle' ? 'bg-emerald-500' : node.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-mono text-slate-200 leading-tight truncate max-w-[140px]" title={node.name || node.nodeId}>
                      {node.name || node.nodeId}
                    </h3>
                  </div>
=======
          nodes.map((node) => (
            <div key={node.node_id || node.nodeId} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{node.name || node.node_id}</p>
                  <p className="text-sm text-slate-400 mt-1">{node.hostname}</p>
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  node.status === 'idle'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : node.status === 'busy'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                }`}>
                  {node.status}
                </span>
              </div>
<<<<<<< HEAD
              
              <p className="text-[11px] text-slate-500 font-sans ml-5 mb-4">{node.hostname}</p>
              
              <div className="inline-flex items-center gap-1.5 bg-space-card border border-space-accent/20 px-2.5 py-1 rounded mb-1 w-max">
                <Cpu className="w-3 h-3 text-space-accent" />
                <span className="text-[11px] text-space-accent font-mono">{node.gpuSummary || 'No GPU Engine'}</span>
=======
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
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
              </div>

              <div className="mt-auto pt-4">
                <VramBar ram={node.ram} />
                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono bg-black/50 pt-3 border-t border-space-accent/5">
                  <div className="flex items-center gap-1.5 opacity-80">
                    <Activity className="w-3 h-3" />
                    <span>Uptime: {formatTime(node.lastHeartbeatAt)}</span>
                  </div>
                  <span className="opacity-80">{node.platform}/{node.arch}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default NodeGrid;

