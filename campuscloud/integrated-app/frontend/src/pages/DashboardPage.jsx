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
} from '../services/api';
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
    workspaceId: '',
    image: 'node:20-alpine',
    commandText: defaultCommand,
    envText: '{}',
    executionMode: 'local',
    requiresGpu: false,
    gpuProfile: 'any',
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
      onClose: () => setConnectionState('disconnected'),
      onError: () => setConnectionState('error'),
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
              <h1 className="text-3xl font-bold mt-2">Workspace Compute Console</h1>
              <p className="text-slate-400 mt-3 max-w-2xl">
                Providers join by running the agent, the backend assigns each node into a low, mid, or high lane,
                and users submit jobs to a workspace without touching scheduler internals.
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

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Workspaces', value: workspaces.length, icon: Waypoints },
            { label: 'Complete Pools', value: stats.completeWorkspaces, icon: Box },
            { label: 'Known Nodes', value: stats.nodes, icon: Server },
            { label: 'Available Nodes', value: stats.availableNodes, icon: Cpu },
            { label: 'Active Jobs', value: stats.activeJobs, icon: Activity },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <stat.icon className="w-5 h-5 text-cyan-300" />
              <p className="text-slate-400 text-sm mt-3">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
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
