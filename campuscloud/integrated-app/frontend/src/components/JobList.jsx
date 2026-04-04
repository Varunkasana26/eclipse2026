import React from 'react';
import { motion } from 'framer-motion';
import { Box, Server } from 'lucide-react';

function formatElapsed(timestamp) {
  if (!timestamp) return '0s';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function EmptyJobQueue() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <motion.div
        animate={{ x: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6 relative opacity-70"
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-space-accent">
          <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 12h4M14 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
      <h3 className="text-base font-semibold text-slate-300 font-sans mb-1">No jobs in queue</h3>
      <p className="text-sm text-slate-500 font-sans">Submit a new job to see it here.</p>
    </div>
  );
}

function JobList({ jobs, selectedJobId, onSelect }) {
  return (
    <div className="bg-black/60 backdrop-blur-xl border-t border-l border-blue-500/40 border-b border-r border-purple-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.3)] hover:border-blue-400/60 hover:scale-[1.01] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] rounded-2xl p-6 transition-all duration-300 relative group flex flex-col h-full">
      <h2 className="text-xl font-semibold font-sans text-white mb-5">Jobs Queue</h2>
      <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[420px] custom-scrollbar">
        {jobs.length === 0 ? (
          <EmptyJobQueue />
        ) : (
          jobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            const status = job.status || 'queued';
            const isYellow = status === 'queued';
            const isCyan = status === 'running' || status === 'assigned';
            const isGreen = status === 'done' || status === 'completed';
            const isRed = status === 'failed';

            return (
              <motion.button
                key={job.id}
                type="button"
                onClick={() => onSelect(job.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`w-full text-left rounded-xl border p-4 shadow-sm transition-colors duration-300 focus:outline-none ${
                  isSelected
                    ? 'border-space-accent/50 bg-space-accent/10 shadow-[0_0_15px_rgba(0,85,255,0.15)]'
                    : 'border-space-accent/10 bg-neutral-900/40 hover:bg-neutral-900/60 hover:border-space-accent/30 hover:shadow-lg hover:shadow-space-accent/10'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold font-mono text-slate-200 truncate leading-tight break-all">
                      {job.id}
                    </p>
                    <span className={`shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                      isYellow ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' :
                      isCyan ? 'border-space-accent/20 bg-space-accent/10 text-space-accent' :
                      isGreen ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                      isRed ? 'border-space-secondary/30 bg-space-secondary/10 text-space-secondary' :
                      'border-slate-500/30 bg-slate-500/10 text-slate-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 opacity-60 text-space-accent" /> 
                        <span className="truncate max-w-[120px] sm:max-w-xs">{job.image || 'N/A'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 opacity-60 text-space-accent" /> 
                        <span className="truncate max-w-[100px]">{job.assignedNodeId || 'pending'}</span>
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500 font-sans uppercase">Elapsed</p>
                      <p className="text-xs font-mono text-slate-300">
                        {job.createdAt ? formatElapsed(job.createdAt) : '0s'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default JobList;
