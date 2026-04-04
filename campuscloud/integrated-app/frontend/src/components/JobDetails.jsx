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

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3">Live Logs</p>
            <pre className="text-xs text-cyan-100 whitespace-pre-wrap break-words max-h-[320px] overflow-y-auto">
              {(job.logs || []).length === 0
                ? 'No logs received yet.'
                : job.logs.map((entry) => `[${entry.stream}] ${entry.text}`).join('\n')}
            </pre>
          </div>

          {job.error ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {job.error}
            </div>
          ) : null}

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

