import React from 'react';
import { Play, TerminalSquare } from 'lucide-react';

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
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
          <label className="block text-sm text-slate-300 mb-2">Docker Image</label>
          <input
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            placeholder="node:20-alpine"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Command</label>
          <textarea
            value={form.commandText}
            onChange={(event) => setForm((current) => ({ ...current, commandText: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
            placeholder={defaultCommand}
          />
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
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </div>
        ) : null}
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
      </form>
    </div>
  );
}

JobForm.defaultProps = {
  form: jobPresets.local,
};

export { defaultCommand };
export default JobForm;
