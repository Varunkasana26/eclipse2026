import React from 'react';
import { Play, TerminalSquare } from 'lucide-react';

const defaultCommand = JSON.stringify(
  ['node', '-e', "console.log('CampusCloud demo job started'); setTimeout(() => console.log('CampusCloud demo job finished'), 750);"],
  null,
  2
);

function JobForm({ form, setForm, onSubmit, isSubmitting, submitError }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <Play className="w-5 h-5 text-cyan-300" />
        <h2 className="text-xl font-semibold">Submit Demo Job</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Container Image</label>
          <input
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            placeholder="node:20-alpine"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Execution Mode</span>
            <select
              value={form.executionMode}
              onChange={(event) =>
                setForm((current) => ({ ...current, executionMode: event.target.value }))
              }
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="local">Local Fallback</option>
              <option value="docker">Docker</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 mt-7">
            <input
              type="checkbox"
              checked={form.gpuRequired}
              onChange={(event) =>
                setForm((current) => ({ ...current, gpuRequired: event.target.checked }))
              }
              className="w-4 h-4 rounded border-slate-600 bg-slate-900"
            />
            <span className="text-sm text-slate-300">Require GPU node</span>
          </label>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Command JSON Array</label>
          <textarea
            value={form.commandText}
            onChange={(event) => setForm((current) => ({ ...current, commandText: event.target.value }))}
            rows={6}
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
            placeholder={defaultCommand}
          />
        </div>
        {submitError ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {submitError}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
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
  form: {
    image: 'node:20-alpine',
    commandText: defaultCommand,
    executionMode: 'local',
    gpuRequired: false,
  },
};

export { defaultCommand };
export default JobForm;
