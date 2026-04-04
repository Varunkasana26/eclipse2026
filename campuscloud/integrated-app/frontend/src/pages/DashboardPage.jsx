<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Box,
  Cpu,
  LogOut,
  Menu,
  Radio,
  Server,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "../components/AnimatedCounter";
import { useAuth } from "../contexts/AuthContext";
import JobDetails from "../components/JobDetails";
import JobForm, { defaultCommand } from "../components/JobForm";
import JobList from "../components/JobList";
import NodeGrid from "../components/NodeGrid";
import { fetchJobs, fetchNodes, submitJob } from "../services/api";
import { connectToEventStream } from "../services/socket";
import AnimatedBackground from "../components/AnimatedBackground";

const Sparkline = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 30"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 25 L20 15 L40 20 L60 5 L80 15 L100 0" />
  </svg>
);
=======
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
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push

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

<<<<<<< HEAD
function TopNav({ connectionState, userEmail, onLogout }) {
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="relative z-50 bg-[#050505]/80 backdrop-blur-md border-b border-space-accent/10 sticky top-0">
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-space-accent via-space-secondary to-space-accent bg-[length:200%_auto] animate-gradient-shift" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="bg-space-accent/10 p-1.5 rounded-lg border border-space-accent/20 shadow-[0_0_10px_rgba(0,85,255,0.2)]">
                <Cpu className="w-5 h-5 text-space-accent" />
              </div>
              <span className="text-slate-100 font-bold tracking-wide font-sans mt-0.5">
                CampusCloud
                <span className="text-space-accent font-semibold text-sm ml-1 hidden sm:inline">
                  MVP
                </span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 font-sans text-sm font-medium">
              <a
                href="#"
                className="px-3 py-1.5 rounded-md bg-space-accent/10 text-space-accent border border-space-accent/20"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                Nodes
              </a>
              <a
                href="#"
                className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                Jobs
              </a>
              <a
                href="#"
                className="px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                Settings
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1 text-right">
                Last Sync
              </span>
              <span className="text-xs text-slate-300 font-mono inline-flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-space-accent drop-shadow-[0_0_5px_rgba(0,85,255,1)]" />
                {lastRefreshed.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            <div
              className="relative flex items-center gap-2 bg-black/50 border border-space-accent/20 rounded-lg px-3 py-1.5 shadow-inner transition-colors duration-300 ease-in-out group hover:border-space-accent/40"
              title={`WebSocket is ${connectionState}`}
            >
              {connectionState === "live" && (
                <span className="absolute left-3 w-3.5 h-3.5 rounded-full border border-green-500 animate-ping opacity-50" />
              )}
              <Radio
                className={`w-3.5 h-3.5 relative z-10 ${connectionState === "live"
                  ? "text-green-400"
                  : connectionState === "error" ||
                    connectionState === "disconnected"
                    ? "text-red-500 animate-pulse"
                    : "text-amber-300"
                  }`}
              />
              <span className="text-xs font-mono hidden sm:inline relative z-10 transition-colors duration-300 ease-in-out">
                WS:
                <span
                  className={`ml-1 font-semibold transition-colors duration-300 ease-in-out ${connectionState === "live"
                    ? "text-green-400"
                    : connectionState === "error" ||
                      connectionState === "disconnected"
                      ? "text-red-500"
                      : "text-amber-300"
                    }`}
                >
                  {connectionState}
                </span>
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-slate-700/60 rounded-lg text-xs text-slate-300">
              <span className="max-w-[180px] truncate">{userEmail || "user"}</span>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-md hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              className="md:hidden text-slate-300 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          className="md:hidden overflow-hidden flex flex-col gap-2 mt-4"
        >
          <div className="pb-3 flex flex-col gap-2">
            <a
              href="#"
              className="px-3 py-2 rounded-md bg-space-accent/10 text-space-accent border border-space-accent/20"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              Nodes
            </a>
            <a
              href="#"
              className="px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              Jobs
            </a>
            <a
              href="#"
              className="px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              Settings
            </a>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-md text-left text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </nav>
  );
=======
function upsertMany(items, nextItems, idKey = 'id') {
  return nextItems.reduce((current, item) => upsertById(current, item, idKey), items);
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
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
<<<<<<< HEAD
                  ...job,
                  logs: [...(job.logs || []), ...(payload.logs || [])].slice(
                    -500,
                  ),
                },
            ),
=======
                    ...job,
                    logs: [...(job.logs || []), ...(payload.logs || [])].slice(-500),
                  }
            )
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
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

<<<<<<< HEAD
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeInOut" },
    },
  };

  return (
    <div className="bg-black min-h-screen text-slate-100 flex flex-col relative isolate">
      <AnimatedBackground />
      <TopNav
        connectionState={connectionState}
        userEmail={user?.email}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10"
        >
          <motion.div variants={itemVariants} className="mb-6 mt-2">
            <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight font-sans text-white drop-shadow-md">
              GPU Sharing Demo Console
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm sm:text-base font-sans">
              Live view of registered provider nodes, queued jobs, assignment
              state, and streamed execution logs.
            </p>
          </motion.div>

          <motion.section
            variants={itemVariants}
            className="flex flex-row gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar"
          >
            {[
              {
                label: "Known Nodes",
                value: stats.nodes,
                icon: Server,
                colorClass: "text-space-accent",
                badgeBg: "bg-space-accent/10",
                change: "+2 since last sync",
                sparkColor: "text-space-accent",
              },
              {
                label: "Available Nodes",
                value: stats.availableNodes,
                icon: Cpu,
                colorClass: "text-green-400",
                badgeBg: "bg-green-400/10",
                change: "+1 since last sync",
                sparkColor: "text-green-400",
              },
              {
                label: "Queued Jobs",
                value: stats.queuedJobs,
                icon: Box,
                colorClass: "text-amber-400",
                badgeBg: "bg-amber-400/10",
                change: "0 since last sync",
                sparkColor: "text-amber-400",
              },
              {
                label: "Active Jobs",
                value: stats.runningJobs,
                icon: Activity,
                colorClass: "text-purple-400",
                badgeBg: "bg-purple-400/10",
                change: "+5 since last sync",
                sparkColor: "text-purple-400",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ ease: "easeInOut", duration: 0.2 }}
                className={`animate-gradient-shift shrink-0 snap-start flex-1 min-w-[280px] bg-black/60 backdrop-blur-xl border-t border-l border-blue-500/40 border-b border-r border-purple-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.3)] hover:border-blue-400/60 hover:scale-[1.01] rounded-2xl p-6 transition-all duration-300 ease-in-out relative overflow-hidden flex flex-col justify-between group shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.badgeBg}`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.colorClass}`} />
                  </div>
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded-md ${stat.badgeBg} ${stat.colorClass} font-mono`}
                  >
                    {stat.change}
                  </span>
                </div>

                <div>
                  <p className="text-gray-300 text-sm font-sans font-medium">{stat.label}</p>
                  <p className="text-[clamp(1.75rem,4vw,2.25rem)] font-extrabold mt-1 font-mono text-white leading-tight">
                    <AnimatedCounter value={stat.value} />
                  </p>
                </div>

                <div className="mt-4">
                  <Sparkline className={`w-full h-10 ${stat.sparkColor} opacity-100`} />
                </div>
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="flex flex-col gap-8 w-full"
          >
            <motion.div variants={itemVariants} className="w-full">
              <NodeGrid nodes={nodes} />
            </motion.div>

            <motion.div variants={itemVariants} className="w-full">
              <JobList
                jobs={jobs}
                selectedJobId={selectedJob?.id}
                onSelect={setSelectedJobId}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="w-full">
              <JobForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="w-full">
              <JobDetails job={selectedJob} />
            </motion.div>
          </motion.section>
        </motion.main>
      </div>
=======
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
>>>>>>> vkasana-be24/feat/campuscloud-recovery-push
    </div>
  );
}

export default DashboardPage;
