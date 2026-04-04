import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Box, Cpu, LogOut, Radio, Server } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import JobDetails from "../components/JobDetails";
import JobForm, { defaultCommand } from "../components/JobForm";
import JobList from "../components/JobList";
import NodeGrid from "../components/NodeGrid";
import { fetchJobs, fetchNodes, submitJob } from "../services/api";
import { connectToEventStream } from "../services/socket";

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

  return (
    <div className="gpu-animated-bg min-h-screen text-slate-100 relative isolate overflow-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        <section className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-cyan-300 text-sm font-semibold tracking-[0.2em] uppercase">
                CampusCloud MVP
              </p>
              <h1 className="text-3xl font-bold mt-2">
                GPU Sharing Demo Console
              </h1>
              <p className="text-slate-400 mt-3 max-w-2xl">
                Live view of registered provider nodes, queued jobs, assignment
                state, and streamed execution logs.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                <Radio className="w-4 h-4 text-cyan-300" />
                <span className="text-sm">
                  WebSocket:
                  <span
                    className={`ml-2 font-semibold ${
                      connectionState === "live"
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    {connectionState}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm">
                <span className="text-slate-400">
                  Logged in as:{" "}
                  <span className="font-semibold text-cyan-300">
                    {user?.email}
                  </span>
                </span>
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
            { label: "Known Nodes", value: stats.nodes, icon: Server },
            {
              label: "Available Nodes",
              value: stats.availableNodes,
              icon: Cpu,
            },
            { label: "Queued Jobs", value: stats.queuedJobs, icon: Box },
            { label: "Active Jobs", value: stats.runningJobs, icon: Activity },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4"
            >
              <stat.icon className="w-5 h-5 text-cyan-300" />
              <p className="text-slate-400 text-sm mt-3">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <NodeGrid nodes={nodes} />
            <JobForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          </div>

          <div className="space-y-6">
            <JobList
              jobs={jobs}
              selectedJobId={selectedJob?.id}
              onSelect={setSelectedJobId}
            />
            <JobDetails job={selectedJob} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
