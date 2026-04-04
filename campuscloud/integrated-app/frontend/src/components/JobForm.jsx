import React from 'react';
import { Play, TerminalSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const defaultCommand =
  'node -e "console.log(\'CampusCloud demo job started\'); setTimeout(() => console.log(\'CampusCloud demo job finished\'), 750)"';

const dockerDemoCommand =
  'python -c "print(\'CampusCloud docker demo job\')"';

const jobPresets = {
  local: {
    image: 'node:20-alpine',
    commandText: defaultCommand,
    executionMode: 'local',
    requiresGpu: false,
    gpuProfile: 'any',
    envText: '{}',
  },
  docker: {
    image: 'python:3.11-slim',
    commandText: dockerDemoCommand,
    executionMode: 'docker',
    requiresGpu: false,
    gpuProfile: 'any',
    envText: '{}',
  },
  gpu: {
    image: 'pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime',
    commandText: 'python -c "print(\'gpu-ready demo\')"',
    executionMode: 'docker',
    requiresGpu: true,
    gpuProfile: 'mid',
    envText: '{}',
  },
};

function JobForm({ form, setForm, onSubmit, isSubmitting, submitError, workspaces }) {
  function applyPreset(presetKey) {
    const preset = jobPresets[presetKey];
    if (!preset) {
      return;
    }

    setForm((current) => ({
      ...current,
      ...preset,
    }));
  }

  return (
    <div className="bg-black/60 backdrop-blur-xl border-t border-l border-blue-500/40 border-b border-r border-purple-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.3)] hover:border-blue-400/60 hover:scale-[1.01] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] rounded-2xl p-6 transition-all duration-300 relative group">
      <div className="flex items-center gap-3 mb-5">
<<<<<<< HEAD
        <Play className="w-5 h-5 text-space-accent" />
        <h2 className="text-xl font-semibold font-sans text-white">Submit Demo Job</h2>
=======
        <Play className="w-5 h-5 text-cyan-300" />
        <h2 className="text-xl font-semibold">Submit Workspace Job</h2>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <button type="button" onClick={() => applyPreset('local')} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100">
          Load Local
        </button>
        <button type="button" onClick={() => applyPreset('docker')} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100">
          Load Docker
        </button>
        <button type="button" onClick={() => applyPreset('gpu')} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100">
          Load GPU
        </button>
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Workspace ID</span>
            <select
              value={form.workspaceId}
              onChange={(event) => setForm((current) => ({ ...current, workspaceId: event.target.value }))}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              {workspaces.length === 0 ? (
                <option value="">No workspace available</option>
              ) : null}
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.id} ({workspace.status})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Execution Mode</span>
            <select
              value={form.executionMode}
              onChange={(event) => setForm((current) => ({ ...current, executionMode: event.target.value }))}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="local">Local Fallback</option>
              <option value="docker">Docker</option>
            </select>
          </label>
        </div>

        <div>
<<<<<<< HEAD
          <label className="block text-sm text-gray-300 mb-2 font-medium">Container Image</label>
=======
          <label className="block text-sm text-slate-300 mb-2">Docker Image</label>
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
          <input
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            className={`w-full rounded-xl bg-black/50 border ${!form.image?.trim() ? 'border-space-secondary shadow-[0_0_10px_rgba(239,68,68,0.15)] focus:border-space-secondary' : 'border-space-accent/20 focus:border-space-accent focus:shadow-[0_0_10px_rgba(0,85,255,0.2)]'} px-4 py-3 text-slate-100 outline-none transition-all font-mono`}
            placeholder="node:20-alpine"
          />
          {!form.image?.trim() && (
            <p className="text-xs text-space-secondary mt-1.5 font-sans">Container image is required.</p>
          )}
        </div>
<<<<<<< HEAD
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="block flex-1">
            <span className="block text-sm text-gray-300 mb-2 font-medium">Execution Mode</span>
            <select
              value={form.executionMode}
              onChange={(event) =>
                setForm((current) => ({ ...current, executionMode: event.target.value }))
              }
              className="w-full rounded-xl bg-black/50 border border-space-accent/20 px-4 py-3 text-slate-100 outline-none focus:border-space-accent focus:shadow-[0_0_10px_rgba(0,85,255,0.2)] transition-all font-sans"
            >
              <option value="local">Local Fallback</option>
              <option value="docker">Docker</option>
            </select>
          </label>
          
          <label className="block flex-1">
            <span className="block text-sm text-gray-300 mb-2 font-medium">Estimated Duration</span>
            <select
              value={form.estimatedDuration || '1h'}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedDuration: event.target.value }))
              }
              className="w-full rounded-xl bg-black/50 border border-space-accent/20 px-4 py-3 text-slate-100 outline-none focus:border-space-accent focus:shadow-[0_0_10px_rgba(0,85,255,0.2)] transition-all font-sans"
            >
              <option value="15m">Short (&lt; 15 mins)</option>
              <option value="1h">Standard (1 hour)</option>
              <option value="12h">Long (12 hours)</option>
              <option value="24h">Very Long (24 hours)</option>
            </select>
          </label>
        </div>

        <div className="pt-2 pb-1 border-t border-space-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.gpuRequired}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gpuRequired: event.target.checked }))
                }
                className="w-4 h-4 rounded border-slate-600 bg-black/50 accent-space-accent"
              />
              <span className="text-sm font-semibold text-gray-200">Require GPU node</span>
            </label>
          </div>

          <motion.div 
            initial={false}
            animate={{ opacity: form.gpuRequired ? 1 : 0.4, height: 'auto' }}
            className={`overflow-hidden ${!form.gpuRequired && 'pointer-events-none'}`}
          >
            <div className="flex justify-between items-end mb-3">
              <label className="block text-xs text-gray-400 font-sans uppercase tracking-wider font-semibold">GPU Memory Allocation</label>
              <span className="text-space-accent font-mono text-sm font-semibold border border-space-accent/20 bg-space-accent/5 px-2 py-0.5 rounded">{form.gpuMemory || 16} GB</span>
            </div>
            <input 
              type="range"
              min="1"
              max="80"
              step="1"
              value={form.gpuMemory || 16}
              onChange={(e) => setForm({...form, gpuMemory: parseInt(e.target.value)})}
              className="w-full accent-space-accent h-2 bg-black/50 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5 px-1">
               <span>1GB</span>
               <span>24GB</span>
               <span>48GB</span>
               <span>80GB</span>
            </div>
          </motion.div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2 font-medium">Command JSON Array</label>
=======

        <div>
          <label className="block text-sm text-slate-300 mb-2">Command</label>
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
          <textarea
            value={form.commandText}
            onChange={(event) => setForm((current) => ({ ...current, commandText: event.target.value }))}
            rows={4}
<<<<<<< HEAD
            className={`w-full rounded-xl bg-black/50 border ${!form.commandText?.trim() ? 'border-space-secondary shadow-[0_0_10px_rgba(239,68,68,0.15)] focus:border-space-secondary' : 'border-space-accent/20 focus:border-space-accent focus:shadow-[0_0_10px_rgba(0,85,255,0.2)]'} px-4 py-3 text-sm text-slate-100 outline-none transition-all whitespace-pre-wrap font-mono custom-scrollbar`}
=======
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
            placeholder={defaultCommand}
          />
          {!form.commandText?.trim() && (
            <p className="text-xs text-space-secondary mt-1.5 font-sans">Command payload cannot be empty.</p>
          )}
        </div>

        <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3">
            <input
              type="checkbox"
              checked={form.requiresGpu}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  requiresGpu: event.target.checked,
                  gpuProfile: event.target.checked ? current.gpuProfile : 'any',
                }))
              }
              className="w-4 h-4 rounded border-slate-600 bg-slate-900"
            />
            <span className="text-sm text-slate-300">Requires GPU</span>
          </label>
          <label className="block lg:col-span-3">
            <span className="block text-sm text-slate-300 mb-2">Minimum GPU profile</span>
            <select
              value={form.gpuProfile}
              onChange={(event) => setForm((current) => ({ ...current, gpuProfile: event.target.value }))}
              disabled={!form.requiresGpu}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="any">Any GPU</option>
              <option value="mid">Mid memory GPU (10GB+)</option>
              <option value="high">High memory GPU (20GB+)</option>
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Environment JSON</label>
          <textarea
            value={form.envText}
            onChange={(event) => setForm((current) => ({ ...current, envText: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
            placeholder='{"DEMO": "true"}'
          />
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-space-secondary/40 bg-space-secondary/10 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </div>
        ) : null}
<<<<<<< HEAD
        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={isSubmitting || !form.image?.trim() || !form.commandText?.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-space-accent to-space-secondary text-white font-bold px-8 py-3.5 shadow-lg ${
              isSubmitting || !form.image?.trim() || !form.commandText?.trim() ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(0,85,255,0.5)] cursor-pointer'
            } transition-all duration-300 font-sans`}
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <TerminalSquare className="w-5 h-5 opacity-80" />
            )}
            {isSubmitting ? 'Summoning Demo Job...' : 'Submit Job Request'}
          </motion.button>
        </div>
=======
        <p className="text-xs text-slate-400">
          The backend assigns the job to the best node in the selected workspace and keeps queueing and capacity limits internal.
        </p>
        <button
          type="submit"
          disabled={isSubmitting || !form.workspaceId}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 text-slate-950 font-semibold px-5 py-3 disabled:opacity-60"
        >
          <TerminalSquare className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Job'}
        </button>
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
      </form>
    </div>
  );
}

JobForm.defaultProps = {
<<<<<<< HEAD
  form: {
    image: 'node:20-alpine',
    commandText: defaultCommand,
    executionMode: 'local',
    gpuRequired: false,
    gpuMemory: 16,
    estimatedDuration: '1h',
  },
=======
  form: jobPresets.local,
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
};

export { defaultCommand };
export default JobForm;
