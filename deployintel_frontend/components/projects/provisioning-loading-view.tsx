"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Server,
  FolderGit2,
  Terminal,
  Sparkles,
  Clock,
  Activity,
  Layers,
  Zap,
} from "lucide-react";

interface ProvisioningLoadingViewProps {
  name: string;
  image: string;
  port?: string | number;
  autoClone: boolean;
  installSemgrep: boolean;
  envVarsCount: number;
  language?: string | null;
}

export function ProvisioningLoadingView({
  name,
  image,
  port,
  autoClone,
  installSemgrep,
  envVarsCount,
  language,
}: ProvisioningLoadingViewProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  const tips = [
    "DeployIntel test containers run with isolated virtual bridge networking and dedicated memory boundaries.",
    installSemgrep
      ? "Semgrep SAST scanner automatically inspects cloned source code for OWASP Top 10 vulnerabilities & security bugs."
      : "You can enable Semgrep in any environment to run instant static application security testing.",
    "Your application dependencies and dev server will auto-boot as soon as the container initializes.",
    "You can open interactive bash sessions and execute ad-hoc commands via the terminal tab anytime.",
    "Environment variables and secrets are injected safely into container runtime memory without disk persistence.",
  ];

  // Stopwatch counter
  useEffect(() => {
    const start = performance.now();
    const interval = setInterval(() => {
      setElapsedMs(Math.floor(performance.now() - start));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Tip rotation
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % tips.length);
    }, 3800);
    return () => clearInterval(tipInterval);
  }, [tips.length]);

  const elapsedSeconds = elapsedMs / 1000;
  const formattedTime = (elapsedSeconds).toFixed(1) + "s";

  // Milestones definition
  const stages = [
    {
      id: "image",
      title: "Resolving Container Image",
      desc: `Verifying layer manifest for ${image}`,
      icon: Layers,
      threshold: 0,
      completeAfter: 1.6,
    },
    {
      id: "network",
      title: "Network Bridge & Port Mapping",
      desc: port
        ? `Binding virtual bridge to port ${port}:TCP`
        : "Allocating dynamic internal bridge adapter",
      icon: Server,
      threshold: 1.6,
      completeAfter: 3.4,
    },
    {
      id: "workspace",
      title: "Workspace & Filesystem Sandbox",
      desc: autoClone
        ? "Cloning repository tree into /workspace"
        : "Mounting isolated volume at /workspace",
      icon: FolderGit2,
      threshold: 3.4,
      completeAfter: 5.4,
    },
    {
      id: "security",
      title: installSemgrep ? "Security Engine: Semgrep SAST" : "Security Isolation",
      desc: installSemgrep
        ? "Preparing Semgrep vulnerability analysis agent"
        : "Applying kernel namespaces & resource quotas",
      icon: ShieldCheck,
      threshold: 5.4,
      completeAfter: 7.2,
    },
    {
      id: "ignition",
      title: "Container Ignition & Auto-Runner",
      desc: "Spawning background runner and streaming health logs",
      icon: Zap,
      threshold: 7.2,
      completeAfter: 9.5,
    },
  ];

  // Dynamic telemetry log entries
  const telemetryLogs: Array<{ time: string; text: string }> = [];
  if (elapsedSeconds >= 0.2) {
    telemetryLogs.push({ time: "0.2s", text: `[INIT] Handshaking with Docker Engine daemon socket` });
  }
  if (elapsedSeconds >= 0.8) {
    telemetryLogs.push({ time: "0.8s", text: `[IMAGE] Manifest inspected: ${image} (target: ${language || "generic"})` });
  }
  if (elapsedSeconds >= 1.9) {
    telemetryLogs.push({ time: "1.9s", text: `[NET] Virtual bridge veth created -> host binding ${port || "auto"}` });
  }
  if (elapsedSeconds >= 3.2) {
    telemetryLogs.push({
      time: "3.2s",
      text: autoClone
        ? `[GIT] Syncing git workspace -> /workspace`
        : `[FS] Initialized sandbox volume at /workspace`,
    });
  }
  if (elapsedSeconds >= 4.5 && envVarsCount > 0) {
    telemetryLogs.push({ time: "4.5s", text: `[ENV] Injected ${envVarsCount} custom environment configuration keys` });
  }
  if (elapsedSeconds >= 5.6 && installSemgrep) {
    telemetryLogs.push({ time: "5.6s", text: `[SEC] Semgrep SAST scanner flagged for background pip install` });
  }
  if (elapsedSeconds >= 7.0) {
    telemetryLogs.push({ time: "7.0s", text: `[SYS] Executing container start command -> waiting for container ID` });
  }
  if (elapsedSeconds >= 8.5) {
    telemetryLogs.push({ time: "8.5s", text: `[DAEMON] Registering auto-start background supervisor...` });
  }

  // Smooth percentage estimate (caps at 95% until mutation completes)
  const progressPercent = Math.min(
    95,
    Math.max(12, Math.floor((elapsedSeconds / 9.5) * 95))
  );

  return (
    <div className="relative overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col max-h-[85vh] select-none">
      {/* Ambient gradient glow in background */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-[#5850ec]/20 rounded-full blur-3xl animate-pulse duration-1000" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse duration-700" />

      {/* Header bar */}
      <div className="relative z-10 px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5850ec] to-indigo-400 text-white shadow-lg shadow-indigo-500/30">
            <Box className="w-4 h-4 animate-bounce duration-1000" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-wide text-white uppercase font-mono">
                Provisioning Container
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5850ec]/20 text-indigo-300 border border-[#5850ec]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-xs sm:max-w-md">
              {name}
            </p>
          </div>
        </div>

        {/* Live Stopwatch Counter */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-inner font-mono text-xs text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-[#5850ec] animate-spin duration-3000" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 p-6 overflow-y-auto space-y-6 flex-1">
        {/* Hologram / Animated Core Display */}
        <div className="relative p-6 rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm overflow-hidden flex flex-col items-center justify-center text-center">
          {/* Radial Grid Pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(#5850ec 1px, transparent 1px), radial-gradient(#10b981 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px",
            }}
          />

          {/* Holographic Container Reactor */}
          <div className="relative w-32 h-32 flex items-center justify-center my-2">
            {/* Outer Rotating Ring */}
            <div
              className="absolute inset-0 rounded-full border border-dashed border-[#5850ec]/40 animate-spin"
              style={{ animationDuration: "16s" }}
            />
            {/* Middle Counter-Rotating Ring */}
            <div
              className="absolute inset-2 rounded-full border border-dotted border-cyan-400/40 animate-spin"
              style={{ animationDuration: "10s", animationDirection: "reverse" }}
            />
            {/* Inner Glowing Orbit */}
            <div className="absolute inset-5 rounded-full border border-indigo-500/20 bg-indigo-950/30 backdrop-blur-xs shadow-[0_0_25px_rgba(88,80,236,0.35)] animate-pulse" />

            {/* Center Cube with Glowing Aura */}
            <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-[#5850ec] to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-indigo-600/50 border border-indigo-300/30">
              <Box className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>

            {/* Scanning beam effect */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent blur-xs animate-[bounce_3s_ease-in-out_infinite]" />
          </div>

          {/* Quick Config Badges */}
          <div className="relative z-10 mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 shadow-xs">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>{image}</span>
            </span>
            {port && (
              <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 flex items-center gap-1.5 shadow-xs">
                <Server className="w-3 h-3 text-cyan-400" />
                <span>Port {port}</span>
              </span>
            )}
            {installSemgrep && (
              <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Semgrep SAST</span>
              </span>
            )}
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full max-w-md mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Activity className="w-3.5 h-3.5 text-[#5850ec] animate-pulse" />
                <span>Sandbox Initialization</span>
              </span>
              <span className="font-bold text-white">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-zinc-700/60 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5850ec] via-purple-500 via-cyan-400 to-emerald-400 transition-all duration-300 relative shadow-[0_0_12px_rgba(88,80,236,0.8)]"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="space-y-2">
          <p className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-1">
            Provisioning Pipeline
          </p>
          <div className="space-y-2">
            {stages.map((stage) => {
              const isCompleted = elapsedSeconds >= stage.completeAfter;
              const isCurrent =
                elapsedSeconds >= stage.threshold && elapsedSeconds < stage.completeAfter;
              const isPending = elapsedSeconds < stage.threshold;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                    isCompleted
                      ? "bg-zinc-900/50 border-emerald-900/40 text-zinc-300"
                      : isCurrent
                      ? "bg-zinc-900 border-[#5850ec]/60 shadow-[0_0_15px_rgba(88,80,236,0.15)] text-white"
                      : "bg-zinc-950/40 border-zinc-900 text-zinc-600 opacity-60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isCompleted
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800/80"
                        : isCurrent
                        ? "bg-[#5850ec]/20 text-indigo-400 border border-[#5850ec]/60"
                        : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5850ec]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isCurrent ? "text-white" : isCompleted ? "text-zinc-200" : "text-zinc-500"
                      }`}
                    >
                      {stage.title}
                    </p>
                    <p className="text-[10.5px] text-zinc-400 truncate mt-0.5">
                      {stage.desc}
                    </p>
                  </div>
                  {isCompleted && (
                    <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                      Ready
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-mono font-medium text-indigo-300 bg-[#5850ec]/20 px-2 py-0.5 rounded border border-[#5850ec]/40 animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Telemetry Console */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[#5850ec]" />
              <span>Daemon Telemetry Stream</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              stdout/events
            </span>
          </div>
          <div className="bg-black/80 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-28 overflow-y-auto space-y-1 shadow-inner">
            {telemetryLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 leading-tight">
                <span className="text-zinc-500 text-[10px] select-none">{log.time}</span>
                <span className="text-emerald-400 select-none">&gt;</span>
                <span className="text-zinc-300">{log.text}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 text-[#5850ec] pt-0.5">
              <span className="text-emerald-400">&gt;</span>
              <span className="inline-block w-2 h-3.5 bg-[#5850ec] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Did You Know / Pro-Tip Banner */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 min-w-0">
            <span className="text-[10.5px] uppercase font-mono font-bold text-amber-400/90 tracking-wider">
              DevOps Intelligence Tip
            </span>
            <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed transition-all duration-300">
              {tips[activeTipIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Footer reassurance bar */}
      <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Container launching in background...</span>
        </span>
        <span className="text-zinc-500 hidden sm:inline">
          Please keep this window open
        </span>
      </div>
    </div>
  );
}
