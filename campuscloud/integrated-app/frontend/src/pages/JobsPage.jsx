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
    <div className="flex flex-col gap-8 bg-transparent min-h-full rounded-3xl relative p-2 scroll-smooth">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      
      <div 
        className="absolute inset-0 z-0 pointer-events-none rounded-3xl"
        style={{ background: 'radial-gradient(circle at top, rgba(0,255,255,0.06), transparent)' }}
      />

      <div className="flex flex-col gap-8 w-full relative z-10">
        <section className="animate-fade-in-up bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)] transition-all duration-300 hover:shadow-[0_10px_50px_rgba(0,255,255,0.12)] hover:-translate-y-[5px] hover:border-cyan-400/30" style={{ animationDelay: '0s' }}>
          <div className="flex items-center gap-3 mb-5">
            <GitBranchPlus className="w-5 h-5 text-cyan-300" />
            <h2 className="text-xl font-semibold text-white">Workspace job routing</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 transition-all duration-300 hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)]">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">Step 1</p>
              <p className="font-semibold text-white mt-2">Pick a workspace</p>
              <p className="text-sm text-slate-400 mt-3">
                Users submit a compute request to one shared workspace instead of targeting raw machines.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 transition-all duration-300 hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)]">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">Step 2</p>
              <p className="font-semibold text-white mt-2">Backend decides routing</p>
              <p className="text-sm text-slate-400 mt-3">
                The backend selects the lane, node, and queue timing using workspace membership and internal capacity rules.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 transition-all duration-300 hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)]">
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-[0.18em]">Step 3</p>
              <p className="font-semibold text-white mt-2">Track live execution</p>
              <p className="text-sm text-slate-400 mt-3">
                Current jobs below show the selected workspace, assigned node and lane, logs, results, and any queue reason.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mt-4 text-sm text-slate-300 transition-all duration-300 hover:scale-105 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)]">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-cyan-300" />
              <p className="font-semibold text-slate-100">Shared workspace rule</p>
            </div>
            <p className="mt-3 text-slate-400">
              Scheduling, lane assignment, capacity headroom, and any internal chunking are managed automatically by the backend.
              End users only pick the workspace and provide the workload details needed to run the job.
            </p>
          </div>
        </section>

        <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.1s' }}>
          <JobForm
            form={form}
            setForm={setForm}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            workspaces={workspaces}
          />
        </div>

        <div className="animate-fade-in-up w-full flex flex-col gap-8" style={{ animationDelay: '0.2s' }}>
          <JobList jobs={jobs} selectedJobId={selectedJob?.id} onSelect={setSelectedJobId} />
          <JobDetails job={selectedJob} />
        </div>
      </div>
    </div>
  );
}

export default JobsPage;
