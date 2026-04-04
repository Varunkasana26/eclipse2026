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

function upsertById(items, nextItem, idKey = "id") {
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
}

function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    image: "node:20-alpine",
    commandText: defaultCommand,
    executionMode: "local",
    gpuRequired: false,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    let active = true;

    Promise.all([fetchNodes(), fetchJobs()])
      .then(([nodesResponse, jobsResponse]) => {
        if (!active) {
          return;
        }

        setNodes(nodesResponse?.items || []);
        setJobs(jobsResponse?.items || []);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setSubmitError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return connectToEventStream({
      onOpen: () => setConnectionState("live"),
      onClose: () => setConnectionState("disconnected"),
      onError: () => setConnectionState("error"),
      onMessage: (message) => {
        const { event, payload } = message;

        if (event === "snapshot") {
          setNodes(payload?.nodes || []);
          setJobs(payload?.jobs || []);
          return;
        }

        if (event === "agent:register" || event === "agent:heartbeat") {
          if (payload?.node) {
            setNodes((current) => upsertById(current, payload.node, "nodeId"));
          }
          return;
        }

        if (event === "job:assign") {
          if (payload?.job) {
            setJobs((current) => upsertById(current, payload.job));
          }
          if (payload?.node) {
            setNodes((current) => upsertById(current, payload.node, "nodeId"));
          }
          return;
        }

        if (
          event === "job:submit" ||
          event === "job:update" ||
          event === "job:complete" ||
          event === "job:failed"
        ) {
          if (payload?.job) {
            setJobs((current) => upsertById(current, payload.job));
          }
          return;
        }

        if (event === "job:log" && payload?.jobId) {
          setJobs((current) =>
            current.map((job) =>
              job.id !== payload.jobId
                ? job
                : {
                  ...job,
                  logs: [...(job.logs || []), ...(payload.logs || [])].slice(
                    -500,
                  ),
                },
            ),
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

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) || jobs[0] || null;

  const stats = useMemo(
    () => ({
      nodes: nodes.length,
      availableNodes: nodes.filter((node) => node.status === "idle").length,
      queuedJobs: jobs.filter((job) => job.status === "queued").length,
      runningJobs: jobs.filter(
        (job) => job.status === "running" || job.status === "assigned",
      ).length,
    }),
    [jobs, nodes],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const command = JSON.parse(form.commandText);
      if (!Array.isArray(command) || command.length === 0) {
        throw new Error(
          'Command must be a JSON array, for example ["node","-e","console.log(1)"]',
        );
      }

      const response = await submitJob({
        image: form.image.trim() || "node:20-alpine",
        command,
        execution_mode: form.executionMode,
        resource_requirements: {
          gpu_required: form.gpuRequired,
        },
        metadata: {
          timeout_ms: 300000,
        },
      });

      if (response?.job?.id) {
        setSelectedJobId(response.job.id);
      }
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

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
    </div>
  );
}

export default DashboardPage;
