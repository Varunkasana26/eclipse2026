import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Box, Cpu, LogOut, Radio, Server, Waypoints } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConsoleNav from '../components/ConsoleNav';
import {
  createOnboardingNode,
  fetchJobs,
  fetchNodes,
  fetchOnboardingNodes,
  fetchWorkspaces,
  submitJob,
  uploadJobAsset,
} from '../services/api';
import { connectToEventStream } from '../services/socket';
import JobsPage from './JobsPage';
import NodesPage from './NodesPage';
import SettingsPage from './SettingsPage';
import TokenomicsPage from './TokenomicsPage';
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

function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState('workspace');
  const [workspaces, setWorkspaces] = useState([]);
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
    jobType: 'python',
    workspaceId: '',
    image: 'node:20-alpine',
    commandText: defaultCommand,
    envText: '{}',
    executionMode: 'local',
    requiresGpu: false,
    gpuProfile: 'any',
    renderEngine: 'blender',
    renderFrameStart: '1',
    renderFrameEnd: '10',
    renderOutputFormat: 'png',
    renderFiles: [],
    demoDurationMinutes: 30,
  });
  const [onboardingForm, setOnboardingForm] = useState({
    workerName: 'Windows GPU Node',
    ownerName: '',
    allowDocker: true,
    tagsText: 'windows,gpu,cuda,hackathon',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  async function refreshClusterState({ silent = false } = {}) {
    try {
      const [workspacesResponse, nodesResponse, jobsResponse, onboardingResponse] = await Promise.all([
        fetchWorkspaces(),
        fetchNodes(),
        fetchJobs(),
        fetchOnboardingNodes(),
      ]);

      setWorkspaces(workspacesResponse?.items || []);
      setNodes(nodesResponse?.items || []);
      setJobs(jobsResponse?.items || []);
      setOnboardingItems(onboardingResponse?.items || []);
    } catch (error) {
      if (!silent) {
        setSubmitError(error.message);
      }
    }
  }

  useEffect(() => {
    let active = true;

    Promise.all([fetchWorkspaces(), fetchNodes(), fetchJobs(), fetchOnboardingNodes()])
      .then(([workspacesResponse, nodesResponse, jobsResponse, onboardingResponse]) => {
        if (!active) {
          return;
        }

        setWorkspaces(workspacesResponse?.items || []);
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
    const interval = setInterval(() => {
      refreshClusterState({ silent: true }).catch(() => {});
    }, connectionState === 'live' ? 30000 : 10000);

    return () => clearInterval(interval);
  }, [connectionState]);

  useEffect(() => {
    if (form.workspaceId || workspaces.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      workspaceId: workspaces[0].id,
    }));
  }, [form.workspaceId, workspaces]);

  useEffect(() => {
    return connectToEventStream({
      onOpen: () => setConnectionState('live'),
      onClose: () => {
        setConnectionState('disconnected');
        refreshClusterState({ silent: true }).catch(() => {});
      },
      onError: () => {
        setConnectionState('error');
        refreshClusterState({ silent: true }).catch(() => {});
      },
      onMessage: (message) => {
        const { event, payload } = message;

        if (event === 'snapshot') {
          setWorkspaces(payload?.workspaces || []);
          setNodes(payload?.nodes || []);
          setJobs(payload?.jobs || []);
          return;
        }

        if (
          (event === 'agent:register' || event === 'agent:heartbeat' || event === 'node:update') &&
          payload?.node
        ) {
          setNodes((current) => upsertById(current, payload.node, 'node_id'));
          if (payload?.workspace) {
            setWorkspaces((current) => upsertById(current, payload.workspace));
          }
          setOnboardingItems((current) =>
            current.map((item) =>
              item.workerId !== payload.node.node_id
                ? item
                : {
                    ...item,
                    status: payload.node.isFresh ? 'connected' : 'offline',
                    connectedAt: item.connectedAt || payload.node.registeredAt,
                    workspaceId: payload.node.workspace_id,
                    assignedWorkspaceId: payload.node.workspace_id,
                    lane: payload.node.lane,
                    detectedLane: payload.node.lane,
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
          if (payload?.workspace) {
            setWorkspaces((current) => upsertById(current, payload.workspace));
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
  const runnableJobs = useMemo(() => jobs.filter((job) => !job.is_parent), [jobs]);

  const stats = useMemo(
    () => ({
      nodes: nodes.length,
      availableNodes: nodes.filter((node) => node.availability === 'available').length,
      queuedJobs: runnableJobs.filter((job) => job.status === 'queued').length,
      activeJobs: runnableJobs.filter((job) => job.status === 'running' || job.status === 'assigned').length,
      completeWorkspaces: workspaces.filter((workspace) => workspace.status === 'complete').length,
    }),
    [nodes, runnableJobs, workspaces]
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

      const minGpuMemoryMb =
        !form.requiresGpu
          ? 0
          : form.gpuProfile === 'high'
            ? 20000
            : form.gpuProfile === 'mid'
              ? 10000
              : 0;
      const isRenderJob = form.jobType === 'render';
      const renderFiles = Array.isArray(form.renderFiles) ? form.renderFiles : [];
      const metadata = {
        job_type: isRenderJob ? 'render' : 'python',
      };

      if (isRenderJob) {
        metadata.asset_upload_expected = renderFiles.length > 0;
        metadata.assets_ready = renderFiles.length === 0;
        metadata.input_artifacts = [];
        metadata.output_artifacts = {
          expected_pattern: `frame_####.${(form.renderOutputFormat || 'png').trim() || 'png'}`,
        };
        metadata.render = {
          engine: form.renderEngine || 'blender',
          frame_start: Math.max(1, Number(form.renderFrameStart) || 1),
          frame_end: Math.max(1, Number(form.renderFrameEnd) || Number(form.renderFrameStart) || 1),
          output_format: (form.renderOutputFormat || 'png').trim() || 'png',
        };
      }

      const response = await submitJob({
        image: form.image.trim() || 'node:20-alpine',
        command: form.commandText.trim() || defaultCommand,
        env,
        workspace_id: form.workspaceId.trim(),
        requires_gpu: form.requiresGpu,
        execution_mode: form.executionMode,
        resource_requirements: {
          gpu_required: form.requiresGpu,
          min_gpu_memory_mb: minGpuMemoryMb,
        },
        metadata,
      });

      setJobs((current) => upsertMany(current, [response?.job, ...(response?.children || [])].filter(Boolean)));
      if (response?.job?.id) {
        setSelectedJobId(response.job.id);
      }

      if (isRenderJob && response?.job?.id && renderFiles.length > 0) {
        let latestJob = response.job;

        for (let index = 0; index < renderFiles.length; index += 1) {
          const uploadResponse = await uploadJobAsset(response.job.id, renderFiles[index], {
            complete: index === renderFiles.length - 1,
          });

          if (uploadResponse?.job) {
            latestJob = uploadResponse.job;
            setJobs((current) => upsertById(current, uploadResponse.job));
          }
        }

        if (latestJob?.id) {
          setSelectedJobId(latestJob.id);
        }
      }

      setForm((current) => ({
        ...current,
        renderFiles: current.jobType === 'render' ? [] : current.renderFiles,
      }));
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
    <div className="gpu-animated-bg min-h-screen text-slate-100 relative isolate overflow-hidden bg-[#040a18]">
      <style>{`
        @keyframes swayRotate {
          0% { transform: translate(-50%, -50%) rotate(-4deg) scale(1.05); opacity: 0.3;}
          50% { transform: translate(-50%, -50%) rotate(4deg) scale(1.1); opacity: 0.5;}
          100% { transform: translate(-50%, -50%) rotate(-4deg) scale(1.05); opacity: 0.3;}
        }
      `}</style>
      
      {/* Massive Rotating GPU Background from Photo */}
      <div 
        className="fixed top-1/2 left-1/2 w-[100vw] h-[100vh] z-[-1] pointer-events-none"
        style={{
          backgroundImage: 'url("/XcxUx88sVYZ4Z2H2qhf7jT-1481-80.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'swayRotate 30s ease-in-out infinite',
        }}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)] hover-tilt transition-all duration-500 hover:shadow-[0_15px_50px_rgba(0,255,255,0.12)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-[40px] pointer-events-none transition-colors duration-500" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 relative z-10">
            <div>
              <p className="text-cyan-400 text-sm font-bold tracking-[0.2em] uppercase drop-[0_0_8px_rgba(0,255,255,0.8)]">CampusCloud MVP</p>
              <h1 className="text-3xl font-bold mt-2 text-white drop-shadow-md">Workspace Compute Console</h1>
              <p className="text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Providers join by running the agent, the backend assigns each node into a low, mid, or high lane,
                and users submit jobs to a workspace without touching scheduler internals.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:border-cyan-400/30 group">
                <Radio className={`w-4 h-4 ${connectionState === 'live' ? 'text-emerald-400 group-hover:animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'text-amber-400'}`} />
                <span className="text-sm font-medium">
                  WebSocket:
                  <span className={`ml-2 font-bold ${connectionState === 'live' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-amber-400'}`}>
                    {connectionState}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:border-cyan-400/30">
                <span className="text-slate-300 font-medium">Logged in as: <span className="font-bold text-cyan-300 drop-shadow-md">{user?.email}</span></span>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1.5 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] text-slate-300 hover:text-rose-400 active:scale-95"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: 'Workspaces', value: workspaces.length, icon: Waypoints, color: 'text-cyan-400', shadow: 'hover:shadow-[0_10px_30px_rgba(34,211,238,0.15)]', border: 'hover:border-cyan-400/40' },
            { label: 'Complete Pools', value: stats.completeWorkspaces, icon: Box, color: 'text-violet-400', shadow: 'hover:shadow-[0_10px_30px_rgba(167,139,250,0.15)]', border: 'hover:border-violet-400/40' },
            { label: 'Known Nodes', value: stats.nodes, icon: Server, color: 'text-indigo-400', shadow: 'hover:shadow-[0_10px_30px_rgba(129,140,248,0.15)]', border: 'hover:border-indigo-400/40' },
            { label: 'Available Nodes', value: stats.availableNodes, icon: Cpu, color: 'text-emerald-400', shadow: 'hover:shadow-[0_10px_30px_rgba(52,211,153,0.15)]', border: 'hover:border-emerald-400/40' },
            { label: 'Active Jobs', value: stats.activeJobs, icon: Activity, color: 'text-amber-400', shadow: 'hover:shadow-[0_10px_30px_rgba(251,191,36,0.15)]', border: 'hover:border-amber-400/40' },
          ].map((stat, idx) => (
            <div key={stat.label} className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 hover-tilt transition-all duration-500 hover:-translate-y-2 group overflow-hidden relative ${stat.shadow} ${stat.border}`}>
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-white/10 transition-colors duration-500" />
              <stat.icon className={`w-6 h-6 mb-3 relative z-10 ${stat.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-300`} />
              <p className="text-slate-300 text-sm font-medium relative z-10">{stat.label}</p>
              <p className="text-3xl font-bold mt-1 text-white relative z-10 drop-shadow-sm">{stat.value}</p>
            </div>
          ))}
        </section>

        <ConsoleNav activeView={activeView} onChange={setActiveView} />

        {activeView === 'workspace' ? (
          <WorkspacePage workspaces={workspaces} stats={stats} connectionState={connectionState} />
        ) : null}
        {activeView === 'nodes' ? (
          <NodesPage
            onboardingForm={onboardingForm}
            setOnboardingForm={setOnboardingForm}
            isCreatingNode={isCreatingNode}
            createNodeError={createNodeError}
            handleCreateNode={handleCreateNode}
            onboardingItems={onboardingItems}
            latestSetup={latestSetup}
            nodes={nodes}
            workspaces={workspaces}
          />
        ) : null}
        {activeView === 'jobs' ? (
          <JobsPage
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            jobs={jobs}
            selectedJob={selectedJob}
            setSelectedJobId={setSelectedJobId}
            workspaces={workspaces}
          />
        ) : null}
        {activeView === 'tokenomics' ? <TokenomicsPage /> : null}
        {activeView === 'settings' ? (
          <SettingsPage
            workspaces={workspaces}
            nodes={nodes}
            jobs={runnableJobs}
            connectionState={connectionState}
          />
        ) : null}
      </main>
    </div>
  );
}

export default DashboardPage;
