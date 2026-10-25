"use client";

import React, { useState } from "react";
import type { Project } from "@/lib/api/project";
import {
  useEnvironments,
  useDockerDaemonStatus,
  useCreateEnvironment,
  useStartEnvironment,
  useStopEnvironment,
  useDeleteEnvironment,
  useEnvironmentLogs,
  useExecuteCommand,
} from "@/hooks/use-environments";
import type {
  TestEnvironment,
  EnvironmentStatus,
} from "@/lib/api/environments";
import {
  Box,
  Play,
  Square,
  Terminal,
  FileText,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Server,
  FolderGit2,
  ExternalLink,
  ChevronRight,
  X,
  Loader2,
  Cpu,
  Layers,
  Key,
} from "lucide-react";

interface EnvironmentsTabProps {
  project: Project;
}

function statusBadge(status: EnvironmentStatus) {
  switch (status) {
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Running
        </span>
      );
    case "STARTING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
          Starting
        </span>
      );
    case "STOPPED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
          <Square className="w-2.5 h-2.5 fill-zinc-400 text-zinc-400" />
          Stopped
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          {status}
        </span>
      );
  }
}

export function EnvironmentsTab({ project }: EnvironmentsTabProps) {
  const {
    data: environments,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEnvironments(project.id);
  const { data: dockerStatus } = useDockerDaemonStatus();

  const createMutation = useCreateEnvironment(project.id);
  const startMutation = useStartEnvironment(project.id);
  const stopMutation = useStopEnvironment(project.id);
  const deleteMutation = useDeleteEnvironment(project.id);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeExecEnv, setActiveExecEnv] = useState<TestEnvironment | null>(null);
  const [activeLogsEnv, setActiveLogsEnv] = useState<TestEnvironment | null>(null);

  // Create form state
  const [name, setName] = useState(`${project.name} Test Runner`);
  const [selectedImage, setSelectedImage] = useState(
    getDefaultImageForLanguage(project.language)
  );
  const [customImage, setCustomImage] = useState("");
  const [port, setPort] = useState<string>("");
  const [autoClone, setAutoClone] = useState(true);

  // Environment variables state
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" },
  ]);
  const [envInputMode, setEnvInputMode] = useState<"pairs" | "raw">("pairs");
  const [rawEnvText, setRawEnvText] = useState("");

  const handleAddEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [{ key: "", value: "" }];
    });
  };

  const handleUpdateEnvVar = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    setEnvVars((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const switchEnvMode = (mode: "pairs" | "raw") => {
    if (mode === "raw") {
      const text = envVars
        .filter((p) => p.key.trim())
        .map((p) => `${p.key.trim()}=${p.value}`)
        .join("\n");
      setRawEnvText(text);
    } else {
      const parsed: Array<{ key: string; value: string }> = [];
      rawEnvText.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          parsed.push({
            key: trimmed.substring(0, eqIdx).trim(),
            value: trimmed.substring(eqIdx + 1).trim(),
          });
        }
      });
      setEnvVars(parsed.length > 0 ? parsed : [{ key: "", value: "" }]);
    }
    setEnvInputMode(mode);
  };

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = customImage.trim() || selectedImage;

    let finalEnvVars: Record<string, string> | undefined = undefined;
    if (envInputMode === "raw") {
      const parsed: Record<string, string> = {};
      rawEnvText.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const k = trimmed.substring(0, eqIdx).trim();
          const v = trimmed.substring(eqIdx + 1).trim();
          if (k) parsed[k] = v;
        }
      });
      if (Object.keys(parsed).length > 0) finalEnvVars = parsed;
    } else {
      const validPairs = envVars.filter((p) => p.key.trim().length > 0);
      if (validPairs.length > 0) {
        finalEnvVars = {};
        validPairs.forEach((p) => {
          finalEnvVars![p.key.trim()] = p.value;
        });
      }
    }

    await createMutation.mutateAsync({
      name: name.trim() || "Test Environment",
      image: finalImage,
      port: port ? parseInt(port, 10) : undefined,
      environmentVariables: finalEnvVars,
      autoClone,
      workspacePath: "/workspace",
    });
    setIsCreateModalOpen(false);
  };

  function getDefaultImageForLanguage(lang?: string | null): string {
    const l = (lang || "").toLowerCase();
    if (l.includes("java")) return "maven:3.9-eclipse-temurin-17";
    if (l.includes("node") || l.includes("script")) return "node:20-alpine";
    if (l.includes("python")) return "python:3.11-slim";
    if (l.includes("go")) return "golang:1.22-alpine";
    if (l.includes("rust")) return "rust:1.75-slim";
    return "ubuntu:22.04";
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Docker Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850ec]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Docker Execution Engine
              </h3>
              {dockerStatus?.connected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected {dockerStatus.serverVersion ? `(v${dockerStatus.serverVersion})` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Daemon Offline
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Isolated containers for running tests, build scripts, and CI verification workflows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#5850ec]" : "text-zinc-500"}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4a42dc] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Test Container</span>
          </button>
        </div>
      </div>

      {/* Docker Offline Warning Banner if not connected */}
      {dockerStatus && !dockerStatus.connected && (
        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">Docker engine not detected: </span>
            Please ensure Docker Desktop is started on your host system. Once started, click <strong>Refresh</strong> above to connect.
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-24 gap-3">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">
            Loading test environments...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-dashed border-rose-200 rounded-xl bg-rose-50/20">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-sm font-semibold text-zinc-800">
            Could not load test environments
          </p>
          <p className="text-xs text-zinc-500 max-w-sm">
            {(error as Error).message}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-[#5850ec] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!environments || environments.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/40">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850ec] mb-4">
            <Box className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-900">
            No test environments running
          </h4>
          <p className="text-xs text-zinc-500 max-w-md mt-1 mb-5">
            Spin up a lightweight Docker container configured for{" "}
            <strong>{project.language || "your project"}</strong> to run unit tests,
            regression suites, or dry-run CI tasks before deploying.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4a42dc] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch First Test Environment</span>
          </button>
        </div>
      )}

      {/* Environments Grid / Cards */}
      {!isLoading && !error && environments && environments.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {environments.map((env) => {
            const isStarting =
              env.status === "STARTING" || startMutation.isPending;
            const isStopping =
              stopMutation.isPending &&
              stopMutation.variables === env.id;
            const isDeleting =
              deleteMutation.isPending &&
              deleteMutation.variables === env.id;

            return (
              <div
                key={env.id}
                className="p-5 rounded-xl border border-zinc-200 bg-white shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 mt-0.5">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-900">
                          {env.name}
                        </h4>
                        {statusBadge(env.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                        <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px] text-zinc-700">
                          {env.image}
                        </span>
                        {env.containerId && (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                            <span>ID: {env.containerId.slice(0, 12)}</span>
                            <button
                              onClick={() =>
                                handleCopy(env.containerId!, env.id)
                              }
                              className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                              title="Copy container ID"
                            >
                              {copiedId === env.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-[11px]">
                          <FolderGit2 className="w-3 h-3 text-zinc-400" />
                          {env.workspacePath}
                        </span>
                        {env.portMapping && (
                          <span className="font-mono text-[11px] bg-indigo-50 text-[#5850ec] px-1.5 py-0.5 rounded border border-indigo-100">
                            Port {env.portMapping}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Run Command / Exec Modal */}
                    <button
                      onClick={() => setActiveExecEnv(env)}
                      disabled={env.status !== "RUNNING"}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Run commands inside container"
                    >
                      <Terminal className="w-3.5 h-3.5 text-[#5850ec]" />
                      <span>Execute</span>
                    </button>

                    {/* View Logs Modal */}
                    <button
                      onClick={() => setActiveLogsEnv(env)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                      title="Inspect container stdout/stderr"
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Logs</span>
                    </button>

                    {/* Start / Stop Toggle */}
                    {env.status === "RUNNING" ? (
                      <button
                        onClick={() => stopMutation.mutate(env.id)}
                        disabled={isStopping}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Stop container"
                      >
                        {isStopping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                        )}
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startMutation.mutate(env.id)}
                        disabled={isStarting}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Start container"
                      >
                        {isStarting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-emerald-700 text-emerald-700" />
                        )}
                        <span>Start</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete test environment "${env.name}" and remove container?`
                          )
                        ) {
                          deleteMutation.mutate(env.id);
                        }
                      }}
                      disabled={isDeleting}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete environment"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Banner if container failed */}
                {env.errorMessage && (
                  <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{env.errorMessage}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE MODAL ────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#5850ec]" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Provision Docker Test Container
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Environment Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CI Regression Container"
                  required
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/20 focus:border-[#5850ec]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Base Docker Image
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { label: "Java (Maven + JDK 17)", img: "maven:3.9-eclipse-temurin-17" },
                    { label: "Node.js (v20 Alpine)", img: "node:20-alpine" },
                    { label: "Python (v3.11 Slim)", img: "python:3.11-slim" },
                    { label: "Go (v1.22 Alpine)", img: "golang:1.22-alpine" },
                    { label: "Ubuntu 22.04 LTS", img: "ubuntu:22.04" },
                  ].map((preset) => (
                    <button
                      key={preset.img}
                      type="button"
                      onClick={() => {
                        setSelectedImage(preset.img);
                        setCustomImage("");
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        selectedImage === preset.img && !customImage
                          ? "border-[#5850ec] bg-indigo-50/50 text-[#5850ec] font-semibold"
                          : "border-zinc-200 hover:border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-[10px] text-zinc-400 font-mono truncate">
                        {preset.img}
                      </div>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  placeholder="Or enter custom image tag (e.g. gradle:8-jdk21)"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/20 focus:border-[#5850ec]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Expose Port (Optional)
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="e.g. 8080 or 3000"
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/20 focus:border-[#5850ec]"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Maps the container port to the host for testing running web servers or APIs.
                </p>
              </div>

              {/* Environment Variables Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                    <Key className="w-3.5 h-3.5 text-[#5850ec]" />
                    <span>Environment Variables (Optional)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => switchEnvMode("pairs")}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                        envInputMode === "pairs"
                          ? "bg-white text-zinc-900 shadow-xs font-semibold"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      Key-Value
                    </button>
                    <button
                      type="button"
                      onClick={() => switchEnvMode("raw")}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                        envInputMode === "raw"
                          ? "bg-white text-zinc-900 shadow-xs font-semibold"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      .env Syntax
                    </button>
                  </div>
                </div>

                {envInputMode === "pairs" ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {envVars.map((envVar, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={envVar.key}
                          onChange={(e) =>
                            handleUpdateEnvVar(idx, "key", e.target.value)
                          }
                          placeholder="VARIABLE_NAME"
                          className="w-5/12 px-2.5 py-1.5 font-mono text-[11px] border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/20 focus:border-[#5850ec]"
                        />
                        <span className="text-zinc-400 font-mono text-xs">=</span>
                        <input
                          type="text"
                          value={envVar.value}
                          onChange={(e) =>
                            handleUpdateEnvVar(idx, "value", e.target.value)
                          }
                          placeholder="value"
                          className="flex-1 px-2.5 py-1.5 font-mono text-[11px] border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/20 focus:border-[#5850ec]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEnvVar(idx)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Remove variable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddEnvVar}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#5850ec] hover:text-[#4a42dc] pt-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Variable</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={rawEnvText}
                      onChange={(e) => setRawEnvText(e.target.value)}
                      rows={4}
                      placeholder={`DATABASE_URL=postgres://user:pass@host:5432/db\nNODE_ENV=test\nAPI_KEY=secret_key`}
                      className="w-full px-3 py-2 font-mono text-[11.5px] border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/20 focus:border-[#5850ec] resize-none"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      One per line in KEY=VALUE format. Comments starting with # are ignored.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoClone"
                  checked={autoClone}
                  onChange={(e) => setAutoClone(e.target.checked)}
                  className="rounded text-[#5850ec] focus:ring-[#5850ec] cursor-pointer"
                />
                <label htmlFor="autoClone" className="text-xs text-zinc-700 cursor-pointer">
                  Auto-clone repository into container workspace (<span className="font-mono text-[11px]">/workspace</span>)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4a42dc] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <span>Launch Environment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EXECUTE COMMAND MODAL ─────────────────────────────────── */}
      {activeExecEnv && (
        <CommandExecModal
          project={project}
          environment={activeExecEnv}
          onClose={() => setActiveExecEnv(null)}
        />
      )}

      {/* ── CONTAINER LOGS MODAL ──────────────────────────────────── */}
      {activeLogsEnv && (
        <ContainerLogsModal
          project={project}
          environment={activeLogsEnv}
          onClose={() => setActiveLogsEnv(null)}
        />
      )}
    </div>
  );
}

// ── Interactive Terminal Modal ─────────────────────────────────────────

function CommandExecModal({
  project,
  environment,
  onClose,
}: {
  project: Project;
  environment: TestEnvironment;
  onClose: () => void;
}) {
  const [command, setCommand] = useState("");
  const [workingDir, setWorkingDir] = useState(environment.workspacePath);
  const [outputHistory, setOutputHistory] = useState<
    { cmd: string; exitCode: number; output: string }[]
  >([]);

  const execMutation = useExecuteCommand(project.id, environment.id);

  const handleRun = async (cmdToRun: string) => {
    if (!cmdToRun.trim()) return;
    try {
      const res = await execMutation.mutateAsync({
        command: cmdToRun.trim(),
        workingDir,
      });
      setOutputHistory((prev) => [
        ...prev,
        { cmd: cmdToRun, exitCode: res.exitCode, output: res.output },
      ]);
      setCommand("");
    } catch (e: any) {
      setOutputHistory((prev) => [
        ...prev,
        {
          cmd: cmdToRun,
          exitCode: -1,
          output: `Execution error: ${e.message}`,
        },
      ]);
    }
  };

  const getQuickCommands = () => {
    const l = (project.language || "").toLowerCase();
    if (l.includes("java")) {
      return ["mvn clean test", "mvn -v", "ls -la"];
    }
    if (l.includes("node") || l.includes("script")) {
      return ["npm test", "npm run build", "node -v", "ls -la"];
    }
    if (l.includes("python")) {
      return ["pytest", "python --version", "ls -la"];
    }
    return ["pwd", "ls -la", "uname -a"];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 text-zinc-100 rounded-2xl max-w-3xl w-full border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
            <Terminal className="w-4 h-4 text-[#5850ec]" />
            <span className="font-bold text-white">{environment.name}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">{environment.image}</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Commands Bar */}
        <div className="px-5 py-2.5 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-zinc-400 font-medium">Quick presets:</span>
          {getQuickCommands().map((qc) => (
            <button
              key={qc}
              onClick={() => handleRun(qc)}
              disabled={execMutation.isPending}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {qc}
            </button>
          ))}
        </div>

        {/* Output Console */}
        <div className="p-5 font-mono text-xs flex-1 overflow-y-auto space-y-4 bg-zinc-950 min-h-[300px]">
          {outputHistory.length === 0 && (
            <div className="text-zinc-500 italic">
              Interactive terminal ready in workspace {workingDir}. Click a quick preset or type a command below.
            </div>
          )}

          {outputHistory.map((item, idx) => (
            <div key={idx} className="space-y-1.5 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-emerald-400">$</span>
                <span className="text-zinc-100 font-semibold">{item.cmd}</span>
                {item.exitCode === 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Exit 0
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    Exit {item.exitCode}
                  </span>
                )}
              </div>
              <pre className="text-zinc-300 whitespace-pre-wrap font-mono text-[11.5px] bg-zinc-900/60 p-3 rounded-lg overflow-x-auto border border-zinc-800/50">
                {item.output || "(no output)"}
              </pre>
            </div>
          ))}

          {execMutation.isPending && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5850ec]" />
              <span>Running command in container...</span>
            </div>
          )}
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRun(command);
          }}
          className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-mono text-sm pl-2">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type command (e.g. mvn test, ls -la, git status)..."
            disabled={execMutation.isPending}
            className="flex-1 bg-zinc-950 text-zinc-100 font-mono text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-hidden focus:border-[#5850ec]"
          />
          <button
            type="submit"
            disabled={!command.trim() || execMutation.isPending}
            className="px-4 py-2 bg-[#5850ec] hover:bg-[#4a42dc] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Container Logs Modal ───────────────────────────────────────────────

function ContainerLogsModal({
  project,
  environment,
  onClose,
}: {
  project: Project;
  environment: TestEnvironment;
  onClose: () => void;
}) {
  const [tail, setTail] = useState(100);
  const { data: logsData, isLoading, refetch, isFetching } = useEnvironmentLogs(
    project.id,
    environment.id,
    tail,
    true
  );

  const [copied, setCopied] = useState(false);
  const handleCopyLogs = () => {
    if (logsData?.logs) {
      navigator.clipboard.writeText(logsData.logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 text-zinc-100 rounded-2xl max-w-3xl w-full border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-4 h-4 text-[#5850ec]" />
            <span className="font-bold text-white">Container Logs:</span>
            <span className="font-mono text-zinc-400">
              {environment.containerName || environment.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#5850ec]" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-[11.5px] flex-1 overflow-y-auto bg-zinc-950 text-zinc-300 whitespace-pre-wrap select-text leading-relaxed">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#5850ec]" />
              <span>Streaming container logs...</span>
            </div>
          ) : logsData?.logs ? (
            logsData.logs
          ) : (
            <div className="text-zinc-500 italic">No output in container log stream.</div>
          )}
        </div>
      </div>
    </div>
  );
}
