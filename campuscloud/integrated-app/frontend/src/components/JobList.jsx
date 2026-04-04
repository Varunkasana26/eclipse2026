import React from 'react';

function JobList({ jobs, selectedJobId, onSelect }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-xl font-semibold mb-5">Jobs</h2>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {jobs.length === 0 ? (
          <div className="text-slate-400 border border-dashed border-slate-700 rounded-2xl p-5">
            No jobs submitted yet.
          </div>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => onSelect(job.id)}
              className={`w-full text-left rounded-2xl border p-4 ${
                selectedJobId === job.id
                  ? 'border-cyan-400 bg-cyan-500/8'
                  : 'border-slate-800 bg-slate-950'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{job.id}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Node: {job.assignedNodeId || 'pending assignment'}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-slate-200 bg-slate-800 rounded-full px-3 py-1">
                  {job.status}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default JobList;
