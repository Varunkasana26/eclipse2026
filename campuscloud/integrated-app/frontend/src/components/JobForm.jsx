import React from 'react';
import { Play, TerminalSquare } from 'lucide-react';
import TokenEstimatorCard from './TokenEstimatorCard';
import { TOKEN_ECONOMY } from '../config/tokenEconomy';
import CustomDropdown from './CustomDropdown';

const defaultCommand =
  'node -e "console.log(\'CampusCloud demo job started\'); setTimeout(() => console.log(\'CampusCloud demo job finished\'), 750)"';

const dockerDemoCommand =
  'python -c "print(\'CampusCloud docker demo job\')"';

const defaultRenderCommand =
  'blender -b /workspace/input/scene.blend -s 1 -e 10 -a';

const jobPresets = {
  local: {
    jobType: 'python',
    image: 'node:20-alpine',
    commandText: defaultCommand,
    executionMode: 'local',
    requiresGpu: false,
    gpuProfile: 'any',
    envText: '{}',
    renderEngine: 'blender',
    renderFrameStart: '1',
    renderFrameEnd: '10',
    renderOutputFormat: 'png',
    renderFiles: [],
    demoDurationMinutes: 30,
  },
  docker: {
    jobType: 'python',
    image: 'python:3.11-slim',
    commandText: dockerDemoCommand,
    executionMode: 'docker',
    requiresGpu: false,
    gpuProfile: 'any',
    envText: '{}',
    renderEngine: 'blender',
    renderFrameStart: '1',
    renderFrameEnd: '10',
    renderOutputFormat: 'png',
    renderFiles: [],
    demoDurationMinutes: 30,
  },
  gpu: {
    jobType: 'python',
    image: 'pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime',
    commandText: 'python -c "print(\'gpu-ready demo\')"',
    executionMode: 'docker',
    requiresGpu: true,
    gpuProfile: 'mid',
    envText: '{}',
    demoDurationMinutes: 30,
  },
  render: {
    jobType: 'render',
    image: 'blender:latest',
    commandText: defaultRenderCommand,
    executionMode: 'docker',
    requiresGpu: true,
    gpuProfile: 'mid',
    envText: '{}',
    renderEngine: 'blender',
    renderFrameStart: '1',
    renderFrameEnd: '10',
    renderOutputFormat: 'png',
    renderFiles: [],
    demoDurationMinutes: 60,
  },
};

function JobForm({ form, setForm, onSubmit, isSubmitting, submitError, workspaces }) {
  const isRenderJob = form.jobType === 'render';

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

  const workspaceOptions = workspaces.length === 0 
    ? [{ label: 'No workspace available', value: '' }] 
    : workspaces.map(w => ({ label: `${w.id} (${w.status})`, value: w.id }));
    
  const demoDurationOptions = TOKEN_ECONOMY.supportedDurations.map(m => ({ label: `${m} minutes`, value: m }));
  
  const jobTypeOptions = [
    { label: 'Python / Command', value: 'python' },
    { label: 'Render', value: 'render' }
  ];

  const executionModeOptions = [
    { label: 'Local Fallback', value: 'local' },
    { label: 'Docker', value: 'docker' }
  ];

  const gpuProfileOptions = [
    { label: 'Any GPU', value: 'any' },
    { label: 'Mid memory GPU (10GB+)', value: 'mid' },
    { label: 'High memory GPU (20GB+)', value: 'high' }
  ];

  const renderEngineOptions = [
    { label: 'Blender', value: 'blender' },
    { label: 'ffmpeg', value: 'ffmpeg' }
  ];

  const btnClass = "rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 text-sm text-slate-100 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40 active:bg-gradient-to-r active:from-cyan-500/20 active:to-blue-500/20 active:scale-95";
  const inputClass = "w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-slate-100 outline-none backdrop-blur-md transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40";

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)] transition-all duration-300 hover:shadow-[0_10px_50px_rgba(0,255,255,0.12)] hover:-translate-y-[5px] hover:border-cyan-400/30">
      <div className="flex items-center gap-3 mb-5">
        <Play className="w-5 h-5 text-cyan-300" />
        <h2 className="text-xl font-semibold text-white">Submit Workspace Job</h2>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <button type="button" onClick={() => applyPreset('local')} className={btnClass}>
          Load Local
        </button>
        <button type="button" onClick={() => applyPreset('docker')} className={btnClass}>
          Load Docker
        </button>
        <button type="button" onClick={() => applyPreset('gpu')} className={btnClass}>
          Load GPU
        </button>
        <button type="button" onClick={() => applyPreset('render')} className={btnClass}>
          Load Render
        </button>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block z-50 relative">
            <span className="block text-sm text-slate-300 mb-2">Job Type</span>
            <CustomDropdown
              value={form.jobType}
              onChange={(e) => setForm((current) => ({ ...current, jobType: e.target.value }))}
              options={jobTypeOptions}
            />
          </label>
          <label className="block z-50 relative">
            <span className="block text-sm text-slate-300 mb-2">Workspace ID</span>
            <CustomDropdown
              value={form.workspaceId || ''}
              onChange={(e) => setForm((current) => ({ ...current, workspaceId: e.target.value }))}
              options={workspaceOptions}
            />
          </label>
          <label className="block z-40 relative">
            <span className="block text-sm text-slate-300 mb-2">Execution Mode</span>
            <CustomDropdown
              value={form.executionMode}
              onChange={(e) => setForm((current) => ({ ...current, executionMode: e.target.value }))}
              options={executionModeOptions}
            />
          </label>
          <label className="block z-40 relative">
            <span className="block text-sm text-slate-300 mb-2">Demo usage estimate</span>
            <CustomDropdown
              value={form.demoDurationMinutes || TOKEN_ECONOMY.billingIncrementMinutes}
              onChange={(e) => setForm((current) => ({ ...current, demoDurationMinutes: Number(e.target.value) }))}
              options={demoDurationOptions}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">{isRenderJob ? 'Render Image' : 'Docker Image'}</label>
          <input
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            className={inputClass}
            placeholder="node:20-alpine"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">{isRenderJob ? 'Render Command' : 'Command'}</label>
          <textarea
            value={form.commandText}
            onChange={(event) => setForm((current) => ({ ...current, commandText: event.target.value }))}
            rows={4}
            className={inputClass}
            placeholder={isRenderJob ? defaultRenderCommand : defaultCommand}
          />
        </div>

        <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
          <label className={`flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 cursor-pointer transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] ${form.requiresGpu ? 'border-cyan-400/50 shadow-[0_0_20px_rgba(0,255,255,0.1)]' : ''}`}>
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
              className="w-4 h-4 rounded border-white/20 bg-black/20 accent-cyan-400 focus:ring-cyan-400/50"
            />
            <span className="text-sm text-slate-300">Requires GPU</span>
          </label>
          <label className="block lg:col-span-3 z-30 relative">
            <span className="block text-sm text-slate-300 mb-2">Minimum GPU profile</span>
            <CustomDropdown
              value={form.gpuProfile}
              onChange={(e) => setForm((current) => ({ ...current, gpuProfile: e.target.value }))}
              options={gpuProfileOptions}
              disabled={!form.requiresGpu}
            />
          </label>
        </div>

        {isRenderJob ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="block z-20 relative">
                <span className="block text-sm text-slate-300 mb-2">Render Engine</span>
                <CustomDropdown
                  value={form.renderEngine}
                  onChange={(e) => setForm((current) => ({ ...current, renderEngine: e.target.value }))}
                  options={renderEngineOptions}
                />
              </label>
              <label className="block">
                <span className="block text-sm text-slate-300 mb-2">Frame Start</span>
                <input
                  type="number"
                  min="1"
                  value={form.renderFrameStart}
                  onChange={(event) => setForm((current) => ({ ...current, renderFrameStart: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-sm text-slate-300 mb-2">Frame End</span>
                <input
                  type="number"
                  min="1"
                  value={form.renderFrameEnd}
                  onChange={(event) => setForm((current) => ({ ...current, renderFrameEnd: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-sm text-slate-300 mb-2">Output Format</span>
                <input
                  value={form.renderOutputFormat}
                  onChange={(event) => setForm((current) => ({ ...current, renderOutputFormat: event.target.value }))}
                  className={inputClass}
                  placeholder="png"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Render Assets</label>
              <input
                type="file"
                multiple
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    renderFiles: Array.from(event.target.files || []),
                  }))
                }
                className={inputClass}
              />
              <p className="text-xs text-slate-400 mt-2">
                Selected files stay local until submit. They are uploaded only for render jobs after the job record is created.
              </p>
              {Array.isArray(form.renderFiles) && form.renderFiles.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 backdrop-blur-sm">
                  {form.renderFiles.map((file) => (
                    <p key={`${file.name}-${file.size}`}>{file.name} ({file.size} bytes)</p>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        <div>
          <label className="block text-sm text-slate-300 mb-2">Environment JSON</label>
          <textarea
            value={form.envText}
            onChange={(event) => setForm((current) => ({ ...current, envText: event.target.value }))}
            rows={4}
            className={inputClass}
            placeholder='{"DEMO": "true"}'
          />
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </div>
        ) : null}
        <p className="text-xs text-slate-400">
          {isRenderJob
            ? 'Render jobs are queued after asset upload completes. Python jobs still follow the existing backend assignment flow.'
            : 'The backend assigns the job to the best node in the selected workspace and keeps queueing and capacity limits internal.'}
        </p>
        <TokenEstimatorCard
          compact
          showSelector={false}
          selectedMinutes={form.demoDurationMinutes || TOKEN_ECONOMY.billingIncrementMinutes}
          title="Demo job cost preview"
          description="This estimate is only for explaining the token economy during the demo. It does not trigger billing, checkout, or payment collection."
        />
        <button
          type="submit"
          disabled={isSubmitting || !form.workspaceId}
          className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-white font-semibold px-5 py-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40 active:bg-gradient-to-r active:from-cyan-500/20 active:to-blue-500/20 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none group relative overflow-hidden"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <TerminalSquare className="w-5 h-5 text-cyan-300 group-hover:text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
              <span>Submit Job</span>
            </>
          )}
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
