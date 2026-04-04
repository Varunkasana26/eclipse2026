import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, CheckCircle2, Trash2 } from 'lucide-react';

function formatTime(value) {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
}

function EmptyTerminalState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      <pre className="text-[8px] sm:text-[10px] md:text-xs text-space-accent/30 font-mono leading-tight mb-8 select-none">
{`   ___                             ___ _                 _ 
  / __\\__ _ _ __ ___  _ __  _   _ / __\\ | ___  _   _  __| |
 / /  / _\` | '_ \` _ \\| '_ \\| | | / /  | |/ _ \\| | | |/ _\` |
/ /__| (_| | | | | | | |_) | |_| \\ \\__| | (_) | |_| | (_| |
\\____/\\__,_|_| |_| |_| .__/ \\__,_\\____/_|\\___/ \\__,_|\\__,_|
                     |_|                                   `}
      </pre>
      <h3 className="text-lg font-semibold text-slate-200 font-sans mb-2 tracking-wide">Awaiting Signal</h3>
      <p className="text-sm text-slate-500 max-w-sm font-sans">Select a job from the queue to stream its live execution telemetry.</p>
    </div>
  );
}

function LogTerminal({ job }) {
  const [activeTab, setActiveTab] = useState('all');
  const [copied, setCopied] = useState(false);
  const [clearedLength, setClearedLength] = useState(0);
  const logsEndRef = useRef(null);

  // Reset clear state when changing jobs
  useEffect(() => {
    setClearedLength(0);
  }, [job.id]);

  const rawLogs = job.logs || [];
  const activeLogs = rawLogs.slice(clearedLength).filter(entry => 
    activeTab === 'all' || entry.stream === activeTab
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLogs]);

  const handleCopy = () => {
    const textToCopy = activeLogs.map(e => `[${e.stream}] ${e.text}`).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderLogs = () => {
    if (activeLogs.length === 0) {
      return <div className="text-slate-500 italic mt-2 ml-2 font-mono">Waiting for log stream...</div>;
    }
    
    return activeLogs.map((entry, idx) => {
       const ts = entry.timestamp ? new Date(entry.timestamp).toISOString().substring(11, 19) : '--:--:--';
       const colorClass = entry.stream === 'stderr' ? 'text-red-400' : 'text-green-400';
       
       return (
         <div key={idx} className="font-mono text-[11px] sm:text-xs leading-relaxed group hover:bg-white/5 px-2 py-0.5 rounded -mx-2 flex gap-3">
           <span className="text-slate-600 shrink-0 select-none">[{ts}]</span>
           <span className={`${colorClass} whitespace-pre-wrap break-all flex-1`}>{entry.text}</span>
         </div>
       );
    });
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border-t border-l border-blue-500/40 border-b border-r border-purple-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.3)] hover:border-blue-400/60 hover:scale-[1.01] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] rounded-2xl overflow-hidden flex flex-col relative group transition-all duration-300">
      {/* Fake Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-space-accent/20 px-3 py-2 select-none">
        <div className="flex items-center gap-3">
           <Terminal className="w-4 h-4 text-space-accent" />
           <div className="flex bg-black rounded-lg border border-slate-800 p-0.5 shadow-inner">
             <button onClick={() => setActiveTab('all')} className={`text-[10px] uppercase font-bold px-3 py-1 rounded-md transition-colors ${activeTab === 'all' ? 'bg-space-accent/20 text-space-accent' : 'text-slate-500 hover:text-slate-300'}`}>All</button>
             <button onClick={() => setActiveTab('stdout')} className={`text-[10px] uppercase font-bold px-3 py-1 rounded-md transition-colors ${activeTab === 'stdout' ? 'bg-space-accent/20 text-space-accent' : 'text-slate-500 hover:text-slate-300'}`}>STDOUT</button>
             <button onClick={() => setActiveTab('stderr')} className={`text-[10px] uppercase font-bold px-3 py-1 rounded-md transition-colors ${activeTab === 'stderr' ? 'bg-space-accent/20 text-space-accent' : 'text-slate-500 hover:text-slate-300'}`}>STDERR</button>
           </div>
        </div>
        <div className="flex items-center gap-1.5">
           <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-space-accent hover:bg-space-accent/10 rounded-md transition-colors" title="Copy to Clipboard">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-space-accent" /> : <Copy className="w-3.5 h-3.5" />}
           </button>
           <button onClick={() => setClearedLength(rawLogs.length)} className="p-1.5 text-slate-400 hover:text-space-secondary hover:bg-space-secondary/10 rounded-md transition-colors" title="Clear Buffer" >
              <Trash2 className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>
      
      {/* Terminal View */}
      <div className="p-4 bg-black min-h-[320px] max-h-[480px] overflow-y-auto custom-scrollbar font-mono text-xs relative">
         <div className="pb-4">
           {renderLogs()}
         </div>
         <div className="flex gap-3 px-2 -mx-2 items-center">
           <span className="text-slate-600 select-none">[{new Date().toISOString().substring(11, 19)}]</span>
           <span className="text-green-500 animate-pulse font-bold">_</span>
         </div>
         <div ref={logsEndRef} />
      </div>
    </div>
  );
}

function JobDetails({ job }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold font-sans mb-5">Selected Job</h2>
      {!job ? (
<<<<<<< HEAD
        <EmptyTerminalState />
      ) : (
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex flex-wrap gap-3 text-sm shrink-0">
            <div className="flex-1 min-w-[140px] bg-black/50 border border-space-accent/10 shadow-sm rounded-xl p-4 transition-colors hover:border-space-accent/30">
              <p className="text-slate-400 font-sans">Status</p>
              <p className="font-semibold font-mono mt-2 text-space-accent">{job.status}</p>
            </div>
            <div className="flex-1 min-w-[140px] bg-black/50 border border-space-accent/10 shadow-sm rounded-xl p-4 transition-colors hover:border-space-accent/30">
              <p className="text-slate-400 font-sans">Assigned Node</p>
              <p className="font-semibold font-mono mt-2 text-white truncate" title={job.assignedNodeId || 'Pending'}>{job.assignedNodeId || 'Pending'}</p>
            </div>
            <div className="flex-1 min-w-[140px] bg-black/50 border border-space-accent/10 shadow-sm rounded-xl p-4 transition-colors hover:border-space-accent/30">
              <p className="text-slate-400 font-sans">Created</p>
              <p className="font-semibold font-mono mt-2 text-white">{formatTime(job.createdAt)}</p>
            </div>
            <div className="flex-1 min-w-[140px] bg-black/50 border border-space-accent/10 shadow-sm rounded-xl p-4 transition-colors hover:border-space-accent/30">
              <p className="text-slate-400 font-sans">Updated</p>
              <p className="font-semibold font-mono mt-2 text-white">{formatTime(job.updatedAt)}</p>
=======
        <div className="text-slate-400">Select a job to inspect live scheduler state and logs.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Status', job.status],
              ['Assigned Node', job.node_id || 'Pending'],
              ['Workspace', job.workspace_id],
              ['Assigned Lane', job.assigned_lane || 'Pending'],
              ['Planned Lane', job.planned_lane || 'Auto'],
              ['Requires GPU', job.requires_gpu ? 'Yes' : 'No'],
              ['Queue reason', job.queue_reason || 'n/a'],
              ['Parent Job', job.parent_job_id || 'Root'],
              ['Chunk', job.parent_job_id ? `${job.chunk_index}/${job.chunk_total}` : 'n/a'],
              ['Chunk Count', job.chunk_count || 1],
              ['Created', formatTime(job.created_at || job.createdAt)],
              ['Updated', formatTime(job.updated_at || job.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <p className="text-slate-400">{label}</p>
                <p className="font-semibold mt-2 break-words">{value}</p>
              </div>
            ))}
          </div>

          {job.is_parent && job.chunk_progress ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200">
              <p className="text-slate-400 mb-3">Chunk Progress</p>
              <p>Queued: {job.chunk_progress.queued}</p>
              <p>Assigned: {job.chunk_progress.assigned}</p>
              <p>Running: {job.chunk_progress.running}</p>
              <p>Completed: {job.chunk_progress.completed}</p>
              <p>Failed: {job.chunk_progress.failed}</p>
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
            </div>
          ) : null}

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3">Command</p>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words">{job.command || 'No command'}</pre>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3">Environment</p>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words">
              {JSON.stringify(job.env || {}, null, 2)}
            </pre>
          </div>

          <div className="flex-1 min-h-[360px] flex flex-col">
            <LogTerminal job={job} />
          </div>

<<<<<<< HEAD
          <div className="bg-black/50 border border-space-accent/10 shadow-sm rounded-xl p-4 transition-colors hover:border-space-accent/30 shrink-0">
            <p className="text-sm text-slate-400 mb-3 font-sans">Result Payload</p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words font-mono max-h-32 overflow-y-auto custom-scrollbar">
=======
          {job.error ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {job.error}
            </div>
          ) : null}

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3">Result Payload</p>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words">
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
              {JSON.stringify(job.result || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetails;

