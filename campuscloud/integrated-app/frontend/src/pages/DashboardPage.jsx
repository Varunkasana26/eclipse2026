import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Box, Cpu, LogOut, Radio, Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConsoleNav from '../components/ConsoleNav';
import { createOnboardingNode, fetchJobs, fetchNodes, fetchOnboardingNodes, submitJob } from '../services/api';
import { connectToEventStream } from '../services/socket';
import JobsPage from './JobsPage';
import NodesPage from './NodesPage';
import SettingsPage from './SettingsPage';
import WorkspacePage from './WorkspacePage';
import { defaultCommand } from '../components/JobForm';

function upsertById(items, nextItem, idKey = 'id') {
  const index = items.findIndex((item) => item[idKey] === nextItem[idKey]);
  if (index === -1) {
    return [nextItem, ...items];
  }

  const copy = [...items];
  copy[index] = {
    ...copy[index],
    ...nextItem,
  };
  return copy;
}

function upsertMany(items, nextItems, idKey = 'id') {
  return nextItems.reduce((current, item) => upsertById(current, item, idKey), items);
}

function buildPlannerJob(job) {
  const plannedTier = job.lane_required || (job.requires_gpu ? 'gpu' : 'any');
  const plannedChunks = job.is_parent ? job.chunk_count || 1 : job.chunk_total || job.chunk_count || 1;
  let planningReason = job.requires_gpu
    ? 'GPU job must respect workspace, lane, and allocation cap'
    : 'Workspace-scoped job with no GPU requirement';

  if (job.is_parent) {
    planningReason = 'Parent tracks aggregate chunk state across child jobs';
  } else if ((job.chunk_total || 1) > 1) {
    planningReason = `Chunk ${Number(job.chunk_index || 1)} of ${job.chunk_total}`;
  }

  return {
    ...job,
    plannedTier,
    plannedChunks,
    planningReason,
  };
}

function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState('workspace');
  const [nodes, setNodes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [onboardingItems, setOnboardingItems] = useState([]);
  const [latestSetup, setLatestSetup] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const [submitError, setSubmitError] = useState('');
  const [createNodeError, setCreateNodeError] = useState('');
  const [form, setForm] = useState({
    workspaceId: 'demo-workspace',
    image: 'node:20-alpine',
    commandText: defaultCommand,
    envText: '{}',
    executionMode: 'local',
    requiresGpu: false,
    laneRequired: '',
    estimatedGpuPercent: 0,
    chunkCount: 1,
  });
  const [onboardingForm, setOnboardingForm] = useState({
    workerName: 'Windows GPU Node',
    ownerName: '',
    workspaceId: 'demo-workspace',
    lane: 'low',
    maxAllocPercent: 70,
    allowDocker: true,
    tagsText: 'windows,gpu,cuda,hackathon',
  });
  const [settings, setSettings] = useState({
    workspaceName: 'CampusCloud Shared Workspace',
    utilizationCapPercent: 70,
    maxUsersPerWorkspace: 6,
    splitMode: 'adaptive',
    maxSplitChunks: 6,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    let active = true;

    Promise.all([fetchNodes(), fetchJobs(), fetchOnboardingNodes()])
      .then(([nodesResponse, jobsResponse, onboardingResponse]) => {
        if (!active) {
          return;
        }

        setNodes(nodesResponse?.items || []);
        setJobs(jobsResponse?.items || []);
        setOnboardingItems(onboardingResponse?.items || []);
      })
      .catch((error) => {
        if (active) {
          setSubmitError(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return connectToEventStream({
      onOpen: () => setConnectionState('live'),
      onClose: () => setConnectionState('disconnected'),
      onError: () => setConnectionState('error'),
      onMessage: (message) => {
        const { event, payload } = message;

        if (event === 'snapshot') {
          setNodes(payload?.nodes || []);
          setJobs(payload?.jobs || []);
          return;
        }

        if (
          (event === 'agent:register' || event === 'agent:heartbeat' || event === 'node:update') &&
          payload?.node
        ) {
          setNodes((current) => upsertById(current, payload.node, 'node_id'));
          setOnboardingItems((current) =>
            current.map((item) =>
              item.workerId !== payload.node.node_id
                ? item
                : {
                    ...item,
                    status: payload.node.isFresh ? 'connected' : 'offline',
                    connectedAt: item.connectedAt || payload.node.registeredAt,
                  }
            )
          );
          return;
        }

        if (
          (event === 'job:submit' ||
            event === 'job:assign' ||
            event === 'job:update' ||
            event === 'job:complete' ||
            event === 'job:failed') &&
          payload?.job
        ) {
          setJobs((current) => upsertById(current, payload.job));
          if (payload?.node) {
            setNodes((current) => upsertById(current, payload.node, 'node_id'));
          }
          return;
        }

        if (event === 'job:log' && payload?.jobId) {
          setJobs((current) =>
            current.map((job) =>
              job.id !== payload.jobId
                ? job
                : {
                    ...job,
                    logs: [...(job.logs || []), ...(payload.logs || [])].slice(-500),
                  }
            )
          );
        }
      },
    });
  }, []);

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0] || null;
  const plannerJobs = useMemo(() => jobs.map((job) => buildPlannerJob(job)), [jobs]);
  const runnableJobs = useMemo(() => jobs.filter((job) => !job.is_parent), [jobs]);

  const workspace = useMemo(() => {
    const groupedNodes = nodes
      .filter((node) => node.status !== 'offline' && node.gpu_available)
      .reduce(
        (accumulator, node) => {
          const lane = node.lane || 'low';
          if (!accumulator[lane]) {
            accumulator[lane] = [];
          }
          accumulator[lane].push(node);
          return accumulator;
        },
        { low: [], mid: [], high: [] }
      );

    const reservePercent = Math.max(0, 100 - settings.utilizationCapPercent);
    const lanes = [
      { id: 'low', label: 'Low', role: 'Starter GPU lane', rangeLabel: '4 GB to 8 GB VRAM', workloadLabel: 'Tiny inference, notebooks, preprocessing', chunkLabel: 'Single chunk or lightweight fan-out' },
      { id: 'mid', label: 'Mid', role: 'Balanced GPU lane', rangeLabel: '10 GB to 16 GB VRAM', workloadLabel: 'Fine-tuning, larger inference batches', chunkLabel: 'Balanced split across 2 chunks' },
      { id: 'high', label: 'High', role: 'Heavy GPU lane', rangeLabel: '20 GB+ VRAM', workloadLabel: 'Large batches, high-memory model tasks', chunkLabel: 'Aggressive split across 3 chunks' },
    ].map((lane) => ({
      ...lane,
      node: groupedNodes[lane.id][0] || null,
      candidateCount: groupedNodes[lane.id].length,
      capPercent: settings.utilizationCapPercent,
      reservePercent,
    }));

    return {
      groupedNodes,
      lanes,
      readyLaneCount: lanes.filter((lane) => lane.node).length,
      queuedChunkCount: runnableJobs.filter((job) => job.status === 'queued' || job.status === 'assigned').length,
    };
  }, [nodes, runnableJobs, settings]);

  const stats = useMemo(
    () => ({
      nodes: nodes.length,
      availableNodes: nodes.filter((node) => node.status === 'idle').length,
      queuedJobs: runnableJobs.filter((job) => job.status === 'queued').length,
      runningJobs: runnableJobs.filter((job) => job.status === 'running' || job.status === 'assigned').length,
    }),
    [nodes, runnableJobs]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const env = form.envText.trim() ? JSON.parse(form.envText) : {};
      if (env && (typeof env !== 'object' || Array.isArray(env))) {
        throw new Error('Environment must be a JSON object.');
      }

      const response = await submitJob({
        image: form.image.trim() || 'node:20-alpine',
        command: form.commandText.trim() || defaultCommand,
        env,
        workspace_id: form.workspaceId.trim() || 'demo-workspace',
        requires_gpu: form.requiresGpu,
        lane_required: form.laneRequired || undefined,
        estimated_gpu_percent: form.requiresGpu ? form.estimatedGpuPercent : 0,
        chunk_count: Math.max(1, form.chunkCount || 1),
        execution_mode: form.executionMode,
      });

      setJobs((current) => upsertMany(current, [response?.job, ...(response?.children || [])].filter(Boolean)));
      if (response?.job?.id) {
        setSelectedJobId(response.job.id);
      }
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateNode(event) {
    event.preventDefault();
    setIsCreatingNode(true);
    setCreateNodeError('');

    try {
      const response = await createOnboardingNode({
        worker_name: onboardingForm.workerName.trim() || 'Windows GPU Node',
        owner_name: onboardingForm.ownerName.trim(),
        workspace_id: onboardingForm.workspaceId.trim() || 'demo-workspace',
        node_lane: onboardingForm.lane,
        max_alloc_percent: onboardingForm.maxAllocPercent,
        allow_docker: onboardingForm.allowDocker,
        tags: onboardingForm.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
      });

      if (response?.setup) {
        setLatestSetup(response.setup);
        setOnboardingItems((current) => upsertById(current, response.setup, 'workerId'));
      }
    } catch (error) {
      setCreateNodeError(error.message);
    } finally {
      setIsCreatingNode(false);
    }
  }

  return (
    <div className="gpu-animated-bg min-h-screen text-slate-100 relative isolate overflow-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        <section className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-cyan-300 text-sm font-semibold tracking-[0.2em] uppercase">CampusCloud MVP</p>
              <h1 className="text-3xl font-bold mt-2">Workspace GPU Console</h1>
              <p className="text-slate-400 mt-3 max-w-2xl">
                Shared workspaces for low-end users, lane-aware scheduling, provider onboarding, reserve-aware allocation, and minimal chunked jobs.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                <Radio className="w-4 h-4 text-cyan-300" />
                <span className="text-sm">
                  WebSocket:
                  <span className={`ml-2 font-semibold ${connectionState === 'live' ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {connectionState}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm">
                <span className="text-slate-400">Logged in as: <span className="font-semibold text-cyan-300">{user?.email}</span></span>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1.5 bg-slate-800 hover:bg-red-600/20 border border-slate-700 hover:border-red-600 rounded-lg transition text-slate-300 hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Known Nodes', value: stats.nodes, icon: Server },
            { label: 'Available Nodes', value: stats.availableNodes, icon: Cpu },
            { label: 'Queued Jobs', value: stats.queuedJobs, icon: Box },
            { label: 'Active Jobs', value: stats.runningJobs, icon: Activity },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <stat.icon className="w-5 h-5 text-cyan-300" />
              <p className="text-slate-400 text-sm mt-3">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </section>

        <ConsoleNav activeView={activeView} onChange={setActiveView} />

        {activeView === 'workspace' ? <WorkspacePage workspace={workspace} stats={stats} settings={settings} connectionState={connectionState} /> : null}
        {activeView === 'nodes' ? (
          <NodesPage workspace={workspace} onboardingForm={onboardingForm} setOnboardingForm={setOnboardingForm} isCreatingNode={isCreatingNode} createNodeError={createNodeError} handleCreateNode={handleCreateNode} onboardingItems={onboardingItems} latestSetup={latestSetup} nodes={nodes} />
        ) : null}
        {activeView === 'jobs' ? (
          <JobsPage form={form} setForm={setForm} onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={submitError} jobs={jobs} selectedJob={selectedJob} setSelectedJobId={setSelectedJobId} plannerJobs={plannerJobs} settings={settings} />
        ) : null}
        {activeView === 'settings' ? <SettingsPage settings={settings} setSettings={setSettings} /> : null}
      </main>
    </div>
  );
}

export default DashboardPage;
