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
  workspaces,
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center gap-3 mb-5">
            <GitBranchPlus className="w-5 h-5 text-cyan-300" />
            <h2 className="text-xl font-semibold">Workspace job routing</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">Step 1</p>
              <p className="font-semibold mt-2">Pick a workspace</p>
              <p className="text-sm text-slate-400 mt-3">
                Users submit a compute request to one shared workspace instead of targeting raw machines.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">Step 2</p>
              <p className="font-semibold mt-2">Backend decides routing</p>
              <p className="text-sm text-slate-400 mt-3">
                The backend selects the lane, node, and queue timing using workspace membership and internal capacity rules.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">Step 3</p>
              <p className="font-semibold mt-2">Track live execution</p>
              <p className="text-sm text-slate-400 mt-3">
                Current jobs below show the selected workspace, assigned node and lane, logs, results, and any queue reason.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mt-4 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-cyan-300" />
              <p className="font-semibold text-slate-100">Shared workspace rule</p>
            </div>
            <p className="mt-3">
              Scheduling, lane assignment, capacity headroom, and any internal chunking are managed automatically by the backend.
              End users only pick the workspace and provide the workload details needed to run the job.
            </p>
          </div>
        </section>

        <JobForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          workspaces={workspaces}
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
