import React from 'react';
import { GitBranchPlus, Shield } from 'lucide-react';
import JobDetails from '../components/JobDetails';
import JobForm from '../components/JobForm';
import JobList from '../components/JobList';

function JobsPage({
  form,
  setForm,
  onSubmit,
  isSubmitting,
  submitError,
  jobs,
  selectedJob,
  setSelectedJobId,
  plannerJobs,
  settings,
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center gap-3 mb-5">
            <GitBranchPlus className="w-5 h-5 text-cyan-300" />
            <h2 className="text-xl font-semibold">Workspace job planner</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {plannerJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400 lg:col-span-3">
                No jobs yet. Submit one and the planner will show which workspace lane, chunk fan-out, and aggregate parent state it targets.
              </div>
            ) : (
              plannerJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">{job.plannedTier}</p>
                  <p className="font-semibold mt-2">{job.id}</p>
                  <p className="text-sm text-slate-400 mt-3">Planned chunks: {job.plannedChunks}</p>
                  <p className="text-sm text-slate-400 mt-1">Reason: {job.planningReason}</p>
                </div>
              ))
            )}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mt-4 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-cyan-300" />
              <p className="font-semibold text-slate-100">Shared workspace rule</p>
            </div>
            <p className="mt-3">
              The job planner never budgets more than {settings.utilizationCapPercent}% of a GPU lane. The remaining
              capacity is held back for burst traffic, retried chunks, and additional users inside the same workspace.
            </p>
          </div>
        </section>

        <JobForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>

      <div className="space-y-6">
        <JobList jobs={jobs} selectedJobId={selectedJob?.id} onSelect={setSelectedJobId} />
        <JobDetails job={selectedJob} />
      </div>
    </div>
  );
}

export default JobsPage;
