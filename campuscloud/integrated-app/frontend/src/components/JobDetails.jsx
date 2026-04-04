import React from 'react';

function formatTime(value) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

function JobDetails({ job }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-xl font-semibold mb-5">Selected Job</h2>
      {!job ? (
        <div className="text-slate-400">Select a job to inspect its live logs.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400">Status</p>
              <p className="font-semibold mt-2">{job.status}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400">Assigned Node</p>
              <p className="font-semibold mt-2">{job.assignedNodeId || 'Pending'}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400">Created</p>
              <p className="font-semibold mt-2">{formatTime(job.createdAt)}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400">Updated</p>
              <p className="font-semibold mt-2">{formatTime(job.updatedAt)}</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3">Live Logs</p>
            <pre className="text-xs text-cyan-100 whitespace-pre-wrap break-words max-h-[320px] overflow-y-auto">
              {(job.logs || []).length === 0
                ? 'No logs received yet.'
                : job.logs.map((entry) => `[${entry.stream}] ${entry.text}`).join('\n')}
            </pre>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3">Result Payload</p>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words">
              {JSON.stringify(job.result || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetails;
