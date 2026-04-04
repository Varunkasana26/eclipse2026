import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

function SettingsPage({ settings, setSettings }) {
  function updateField(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const reservePercent = Math.max(0, 100 - settings.utilizationCapPercent);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center gap-3 mb-5">
          <SlidersHorizontal className="w-5 h-5 text-cyan-300" />
          <h2 className="text-xl font-semibold">Workspace settings</h2>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Workspace name</span>
            <input
              value={settings.workspaceName}
              onChange={(event) => updateField('workspaceName', event.target.value)}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">GPU utilization cap: {settings.utilizationCapPercent}%</span>
            <input
              type="range"
              min="40"
              max="90"
              step="5"
              value={settings.utilizationCapPercent}
              onChange={(event) => updateField('utilizationCapPercent', Number(event.target.value))}
              className="w-full"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Max users in one workspace</span>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.maxUsersPerWorkspace}
              onChange={(event) => updateField('maxUsersPerWorkspace', Number(event.target.value) || 1)}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Split mode</span>
            <select
              value={settings.splitMode}
              onChange={(event) => updateField('splitMode', event.target.value)}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="adaptive">Adaptive split</option>
              <option value="balanced">Balanced chunks</option>
              <option value="priority-high">High-tier first</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm text-slate-300 mb-2">Max chunk fan-out</span>
            <input
              type="number"
              min="1"
              max="12"
              value={settings.maxSplitChunks}
              onChange={(event) => updateField('maxSplitChunks', Number(event.target.value) || 1)}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h2 className="text-xl font-semibold">Policy preview</h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Active budget</p>
            <p className="text-3xl font-bold mt-2">{settings.utilizationCapPercent}%</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Reserved headroom</p>
            <p className="text-3xl font-bold mt-2">{reservePercent}%</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Workspace members</p>
            <p className="text-3xl font-bold mt-2">{settings.maxUsersPerWorkspace}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Chunk fan-out</p>
            <p className="text-3xl font-bold mt-2">{settings.maxSplitChunks}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mt-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">What this page controls</p>
          <p className="mt-3">
            This settings page is the UI contract for the scheduler you described in the doc: workspace-level allocation,
            3-tier GPU lanes, multi-user reserve capacity, and task splitting rules. The live backend scheduler does not
            persist these settings yet, but this page defines the product behavior we should wire next.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
