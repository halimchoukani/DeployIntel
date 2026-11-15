"use client";

import React, { useState } from "react";
import { useReleases, useCreateRelease } from "@/hooks/use-releases";
import type { Release, ReleaseEnvironment, ReleaseStatus } from "@/lib/api/releases";
import type { Project } from "@/lib/api/project";
import {
  Tag,
  GitCommit,
  GitBranch,
  Clock,
  PackageCheck,
  PackageX,
  Package,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  Rocket,
  Plus,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  History,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Ban,
  CircleCheckBig,
  CircleX,
  TriangleAlert,
  Sparkles,
  BarChart2,
} from "lucide-react";

interface ReleasesTabProps {
  project: Project;
  onNavigateToTestHistory?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function envBadge(env: ReleaseEnvironment) {
  const map: Record<ReleaseEnvironment, string> = {
    PRODUCTION: "bg-violet-50 text-violet-700 border-violet-200",
    STAGING: "bg-amber-50 text-amber-700 border-amber-200",
    DEVELOPMENT: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return map[env] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function statusIcon(status: ReleaseStatus) {
  switch (status) {
    case "SUCCESS":
      return <PackageCheck className="w-4 h-4 text-emerald-500" />;
    case "FAILED":
      return <PackageX className="w-4 h-4 text-rose-500" />;
    case "BLOCKED":
      return <Ban className="w-4 h-4 text-red-600" />;
    case "DRAFT":
      return <Package className="w-4 h-4 text-zinc-400" />;
    default:
      return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
  }
}

function statusLabel(status: ReleaseStatus) {
  const map: Record<ReleaseStatus, { label: string; cls: string }> = {
    SUCCESS: { label: "Success", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    FAILED:  { label: "Failed",  cls: "text-rose-600 bg-rose-50 border-rose-200" },
    BLOCKED: { label: "Blocked", cls: "text-red-700 bg-red-50 border-red-300" },
    DRAFT:   { label: "Draft",   cls: "text-zinc-500 bg-zinc-50 border-zinc-200" },
    PENDING: { label: "Pending", cls: "text-amber-600 bg-amber-50 border-amber-200" },
  };
  const s = map[status] ?? { label: status, cls: "text-zinc-500 bg-zinc-50 border-zinc-200" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      {statusIcon(status)}
      {s.label}
    </span>
  );
}

function testVerdictBadge(verdict?: string) {
  switch (verdict?.toUpperCase()) {
    case "PASSED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Gates Passed
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          Gate Blocked
        </span>
      );
    case "RUNNING":
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          Running Tests...
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200">
          Not Run
        </span>
      );
  }
}

/** Deployment decision badge: PASS / WARN / BLOCK */
function decisionBadge(decision?: string) {
  switch (decision) {
    case "PASS":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CircleCheckBig className="w-3.5 h-3.5" />
          PASS
        </span>
      );
    case "WARN":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <TriangleAlert className="w-3.5 h-3.5" />
          WARN
        </span>
      );
    case "BLOCK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-300">
          <CircleX className="w-3.5 h-3.5" />
          BLOCK
        </span>
      );
    default:
      return null;
  }
}

/** Risk level badge with semantic meaning */
function riskLevelBadge(score: number) {
  if (score >= 80) return { level: "LOW", color: "emerald", icon: CircleCheckBig, desc: "Safe to deploy" };
  if (score >= 60) return { level: "MEDIUM", color: "amber", icon: TriangleAlert, desc: "Review recommended" };
  if (score >= 40) return { level: "HIGH", color: "orange", icon: AlertTriangle, desc: "Significant risk" };
  return { level: "CRITICAL", color: "red", icon: CircleX, desc: "Do not deploy" };
}

/** Enhanced circular score gauge with animated progress and risk level */
function ScoreGauge({ score, decision, size = 72 }: { score: number; decision?: string; size?: number }) {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circumference - (pct / 100) * circumference;

  const color =
    decision === "BLOCK"
      ? "#ef4444"
      : decision === "WARN"
      ? "#f59e0b"
      : "#10b981";

  const textColor =
    decision === "BLOCK"
      ? "text-red-600"
      : decision === "WARN"
      ? "text-amber-600"
      : "text-emerald-600";

  const risk = riskLevelBadge(score);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="6"
          />
          {/* Arc with gradient */}
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${textColor}`} style={{ lineHeight: 1 }}>
            {Math.round(pct)}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wide ${textColor}`}>
            {risk.level}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            risk.color === "emerald" ? "bg-emerald-50 text-emerald-700" :
            risk.color === "amber" ? "bg-amber-50 text-amber-700" :
            risk.color === "orange" ? "bg-orange-50 text-orange-700" :
            "bg-red-50 text-red-700"
          }`}
        >
          <risk.icon className="w-3 h-3" />
          {risk.desc}
        </span>
      </div>
    </div>
  );
}

/** Horizontal sub-score bar with better visual design */
function ScoreBar({ label, value, icon, weight }: { label: string; value: number; icon: React.ReactNode; weight?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : pct >= 40 ? "bg-orange-400" : "bg-red-500";

  const labelColor =
    pct >= 80 ? "text-emerald-700" : pct >= 60 ? "text-amber-700" : pct >= 40 ? "text-orange-700" : "text-red-700";

  const bgColor =
    pct >= 80 ? "bg-emerald-50" : pct >= 60 ? "bg-amber-50" : pct >= 40 ? "bg-orange-50" : "bg-red-50";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className={`flex items-center gap-1.5 font-medium ${labelColor}`}>
          {icon}
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${labelColor}`}>{Math.round(pct)}</span>
          {weight && <span className="text-[10px] text-zinc-400 font-mono">{weight}</span>}
        </div>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold markers */}
        <div className="absolute top-0 bottom-0 left-[60%] w-px bg-zinc-300/50" />
        <div className="absolute top-0 bottom-0 left-[80%] w-px bg-zinc-300/50" />
      </div>
      <div className="flex justify-between text-[9px] text-zinc-400">
        <span>Needs Review</span>
        <span>Acceptable</span>
        <span>Good</span>
      </div>
    </div>
  );
}

/** Risk factor card for detailed breakdown */
function RiskFactorCard({
  title,
  score,
  icon,
  description,
  findings,
  weight,
}: {
  title: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  findings?: { critical: number; high: number; medium: number; low: number };
  weight?: string;
}) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? "emerald" : pct >= 60 ? "amber" : pct >= 40 ? "orange" : "red";

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === "emerald" ? "bg-emerald-50 text-emerald-600" : color === "amber" ? "bg-amber-50 text-amber-600" : color === "orange" ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-sm font-semibold text-zinc-900">{title}</h5>
            <span className={`text-sm font-bold ${color === "emerald" ? "text-emerald-600" : color === "amber" ? "text-amber-600" : color === "orange" ? "text-orange-600" : "text-red-600"}`}>
              {Math.round(pct)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{description}</p>
          {weight && (
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-50 rounded">
              Weight: {weight}
            </span>
          )}
          {findings && (
            <div className="mt-3 flex items-center gap-2 text-[10px]">
              {findings.critical > 0 && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium">{findings.critical} Critical</span>}
              {findings.high > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">{findings.high} High</span>}
              {findings.medium > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{findings.medium} Medium</span>}
              {findings.low > 0 && <span className="px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-700 font-medium">{findings.low} Low</span>}
              {(findings.critical + findings.high + findings.medium + findings.low) === 0 && (
                <span className="text-zinc-400">No findings</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function shortSha(sha: string) {
  return sha.startsWith("refs/") ? sha : sha.slice(0, 7);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReleasesTab({ project, onNavigateToTestHistory }: ReleasesTabProps) {
  const { data: releases = [], isLoading, error, refetch } = useReleases(project.id);
  const createReleaseMutation = useCreateRelease();

  const [selected, setSelected] = useState<Release | null>(null);
  const [envFilter, setEnvFilter] = useState<ReleaseEnvironment | "ALL">("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [versionNumber, setVersionNumber] = useState("");
  const [environment, setEnvironment] = useState<ReleaseEnvironment>("PRODUCTION");
  const [branch, setBranch] = useState(project.defaultBranch || "main");
  const [commitSha, setCommitSha] = useState("");
  const [tag, setTag] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const filtered = releases.filter(
    (r) => envFilter === "ALL" || r.environment === envFilter
  );

  const handleOpenCreate = () => {
    const nextVer = releases.length > 0 ? `v1.${releases.length}.0` : "v1.0.0";
    setVersionNumber(nextVer);
    setBranch(project.defaultBranch || "main");
    setCommitSha(Math.random().toString(36).substring(2, 10));
    setTag(nextVer);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber.trim()) { setCreateError("Version number is required"); return; }
    setCreateError(null);
    try {
      await createReleaseMutation.mutateAsync({
        projectId: project.id,
        versionNumber: versionNumber.trim(),
        commitSha: commitSha.trim() || Math.random().toString(36).substring(2, 10),
        branch: branch.trim() || "main",
        tag: tag.trim() || versionNumber.trim(),
        environment,
      });
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create release");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">Loading releases…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-sm font-semibold text-zinc-700">Could not load releases</p>
        <p className="text-xs text-zinc-400 max-w-xs">{(error as Error).message}</p>
        <button onClick={() => refetch()} className="mt-2 text-xs font-semibold text-[#5850ec] hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Rocket className="w-7 h-7 text-[#5850ec]" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-800">No releases yet</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Releases trigger automatic security (Semgrep) and performance (k6) gate checks. A composite risk score determines PASS or BLOCK.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-4 py-2 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create First Release
        </button>
      </div>
    );
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Release History & Gate Evaluations</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {releases.length} release{releases.length !== 1 ? "s" : ""} recorded • Composite risk score drives PASS / BLOCK decisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
            {(["ALL", "PRODUCTION", "STAGING", "DEVELOPMENT"] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvFilter(env)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  envFilter === env
                    ? "bg-white text-[#5850ec] shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {env === "ALL" ? "All" : env.charAt(0) + env.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#5850ec] hover:bg-[#4d44e7] text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
              <th className="py-3 px-5 text-left">Version</th>
              <th className="py-3 px-4 text-left">Environment</th>
              <th className="py-3 px-4 text-left">Risk Score</th>
              <th className="py-3 px-4 text-left">Decision</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Commit</th>
              <th className="py-3 px-4 text-left">Branch / Tag</th>
              <th className="py-3 px-4 text-right">Released</th>
              <th className="py-3 px-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-400 text-xs">
                  No releases matching the selected environment.
                </td>
              </tr>
            ) : (
              filtered.map((release) => (
                <tr
                  key={release.id}
                  onClick={() => setSelected(release)}
                  className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                >
                  {/* Version */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Tag className="w-3.5 h-3.5 text-[#5850ec]" />
                      </div>
                      <span className="font-bold text-zinc-900">{release.versionNumber}</span>
                    </div>
                  </td>

                  {/* Environment */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${envBadge(release.environment)}`}>
                      {release.environment.charAt(0) + release.environment.slice(1).toLowerCase()}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {release.compositeScore != null ? (
                      <div className="flex items-center gap-2">
                        {/* Score pill with risk level */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                            release.deploymentDecision === "BLOCK"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : release.deploymentDecision === "WARN"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {Math.round(release.compositeScore)}
                        </span>
                        {/* Risk level badge */}
                        {(() => {
                          const risk = riskLevelBadge(release.compositeScore);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              risk.color === "emerald" ? "bg-emerald-50 text-emerald-700" :
                              risk.color === "amber" ? "bg-amber-50 text-amber-700" :
                              risk.color === "orange" ? "bg-orange-50 text-orange-700" :
                              "bg-red-50 text-red-700"
                            }`}>
                              <risk.icon className="w-3 h-3" />
                              {risk.level}
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-zinc-300 text-[11px]">
                        {release.status === "PENDING" ? (
                          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin inline" />
                        ) : "—"}
                      </span>
                    )}
                  </td>

                  {/* Decision */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {release.deploymentDecision
                      ? decisionBadge(release.deploymentDecision)
                      : testVerdictBadge(release.testVerdict)}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {statusLabel(release.status)}
                  </td>

                  {/* Commit SHA */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                      {shortSha(release.commitSha)}
                    </span>
                  </td>

                  {/* Branch / Tag */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      {release.tag ? (
                        <>
                          <Tag className="w-3 h-3 text-zinc-400" />
                          <span className="font-mono">{release.tag}</span>
                        </>
                      ) : release.branch ? (
                        <>
                          <GitBranch className="w-3 h-3 text-zinc-400" />
                          <span className="font-mono">{release.branch}</span>
                        </>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="py-4 px-4 text-right whitespace-nowrap text-zinc-400">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(release.createdAt)}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(release); }}
                      className="text-xs font-semibold text-[#5850ec] hover:text-[#4d44e7] p-1.5 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-[#5850ec]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Release Overview</p>
                  <h3 className="text-base font-bold text-zinc-900">{selected.versionNumber}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Composite Risk Score Panel ───────────────────────────────────── */}
            {selected.compositeScore != null ? (
              <div className={`rounded-2xl border p-5 ${
                selected.deploymentDecision === "BLOCK"
                  ? "bg-red-50 border-red-200"
                  : selected.deploymentDecision === "WARN"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Gauge */}
                  <ScoreGauge
                    score={selected.compositeScore}
                    decision={selected.deploymentDecision}
                    size={88}
                  />

                  {/* Score summary & breakdown */}
                  <div className="flex-1 min-w-0 md:grid md:grid-cols-3 gap-4">
                    {/* Main summary */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-zinc-700">Composite Risk Score</span>
                        {decisionBadge(selected.deploymentDecision)}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                        {selected.decisionReason ?? "Risk assessment completed."}
                      </p>

                      {/* Formula & thresholds */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400">
                        <span className="font-mono bg-white/70 px-2 py-0.5 rounded border border-zinc-200">
                          composite = sec×0.40 + perf×0.35 + tests×0.15 + reg×0.10
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">≥80 PASS</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">60–79 WARN</span>
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium">{"<"}60 BLOCK</span>
                      </div>
                    </div>

                    {/* Quick score bars */}
                    <div className="space-y-2 md:col-span-1">
                      <ScoreBar
                        label="Security"
                        value={selected.securityScore ?? selected.compositeScore ?? 0}
                        icon={<Shield className="w-3 h-3 text-purple-500" />}
                        weight="40%"
                      />
                      <ScoreBar
                        label="Performance"
                        value={selected.performanceScore ?? selected.compositeScore ?? 0}
                        icon={<Zap className="w-3 h-3 text-amber-500" />}
                        weight="35%"
                      />
                      <ScoreBar
                        label="Test Checks"
                        value={selected.testScore ?? selected.compositeScore ?? 0}
                        icon={<CheckCircle2 className="w-3 h-3 text-sky-500" />}
                        weight="15%"
                      />
                      <ScoreBar
                        label="Regression"
                        value={selected.regressionScore ?? 100}
                        icon={<TrendingUp className="w-3 h-3 text-emerald-500" />}
                        weight="10%"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* No score yet — show pending state */
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 flex items-center gap-3">
                {selected.status === "PENDING" ? (
                  <>
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-700">Gate checks in progress…</p>
                      <p className="text-[11px] text-zinc-400">Composite risk score will appear once both Semgrep and k6 tests complete.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-700">No risk score available</p>
                      <p className="text-[11px] text-zinc-400">Gate checks may not have run for this release.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Detailed Risk Factor Cards ───────────────────────────────────── */}
            {selected.compositeScore != null && (
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#5850ec]" />
                  Risk Factor Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <RiskFactorCard
                    title="Security (Semgrep SAST)"
                    score={selected.securityScore ?? selected.compositeScore ?? 0}
                    icon={<Shield className="w-5 h-5" />}
                    description="Static analysis findings mapped to CWE/OWASP categories. Critical and high severity findings heavily penalize the score."
                    weight="40%"
                  />
                  <RiskFactorCard
                    title="Performance (k6 Load Test)"
                    score={selected.performanceScore ?? selected.compositeScore ?? 0}
                    icon={<Zap className="w-5 h-5" />}
                    description="Load test results measuring request rate, p95 latency, and error rate against defined thresholds."
                    weight="35%"
                  />
                  <RiskFactorCard
                    title="Test Checks"
                    score={selected.testScore ?? selected.compositeScore ?? 0}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    description="Overall test suite pass rate across all executed test runs for this release."
                    findings={selected.testRuns ? {
                      critical: 0,
                      high: selected.testRuns.filter((t: any) => t.status === "FAILED").length,
                      medium: selected.testRuns.filter((t: any) => t.status === "RUNNING").length,
                      low: selected.testRuns.filter((t: any) => t.status === "PASSED").length,
                    } : undefined}
                    weight="15%"
                  />
                  <RiskFactorCard
                    title="Regression Risk"
                    score={selected.regressionScore ?? 100}
                    icon={<TrendingUp className="w-5 h-5" />}
                    description="Comparison against baseline to detect performance or functional regressions. Defaults to 100 (no regression detected)."
                    weight="10%"
                  />
                </div>
              </div>
            )}

            {/* Release metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-100">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Release Status</p>
                {statusLabel(selected.status)}
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Gate Check State</p>
                {testVerdictBadge(selected.testVerdict)}
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Environment</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${envBadge(selected.environment)}`}>
                  {selected.environment.charAt(0) + selected.environment.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Commit SHA</p>
                <span className="font-mono text-[11px] text-zinc-700 break-all">{selected.commitSha}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Branch</p>
                <span className="font-mono text-zinc-700">{selected.branch ?? "—"}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Released</p>
                <span className="text-zinc-700">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Test Runs */}
            {selected.testRuns && selected.testRuns.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#5850ec]" />
                  Executed Automated Gate Checks:
                </h4>
                <div className="divide-y divide-zinc-100 bg-zinc-50 rounded-xl border border-zinc-200/70">
                  {selected.testRuns.map((tr) => (
                    <div key={tr.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {tr.type === "SECURITY" ? (
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-purple-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-zinc-800">
                            {tr.type === "SECURITY" ? "Semgrep SAST Security" : "Grafana k6 Performance"}
                          </span>
                          <span className="text-[11px] text-zinc-400 block">
                            {tr.passedTests}/{tr.totalTests} tests passed
                            {tr.durationMs ? ` • ${(tr.durationMs / 1000).toFixed(1)}s` : ""}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          tr.status === "PASSED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : tr.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {tr.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between">
              {onNavigateToTestHistory && (
                <button
                  onClick={() => { setSelected(null); onNavigateToTestHistory(); }}
                  className="text-xs font-semibold text-[#5850ec] hover:underline flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  View in Test History
                </button>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Release Modal ────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#5850ec]" />
                <h3 className="text-sm font-bold text-zinc-900">Create New Release</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              When created, DeployIntel will automatically run Semgrep SAST and k6 performance checks,
              then compute a <strong>composite risk score</strong> to decide PASS or BLOCK.
            </p>

            {createError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRelease} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Version Number *</label>
                <input
                  type="text"
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="e.g. v2.1.0"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5850ec]/30 focus:border-[#5850ec]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Target Environment *</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as ReleaseEnvironment)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5850ec]/30 focus:border-[#5850ec]"
                >
                  <option value="PRODUCTION">Production</option>
                  <option value="STAGING">Staging</option>
                  <option value="DEVELOPMENT">Development</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Commit SHA</label>
                  <input
                    type="text"
                    value={commitSha}
                    onChange={(e) => setCommitSha(e.target.value)}
                    placeholder="e.g. 7f9a2b1"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Scoring info panel */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-700 space-y-1">
                <p className="font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Risk Score Formula</p>
                <p className="font-mono text-[10px] text-indigo-500">
                  score = Security×40% + Performance×35% + Tests×15% + Regression×10%
                </p>
                <p>Score ≥ 80 → <strong>PASS</strong> &nbsp;|&nbsp; 60–79 → <strong>WARN</strong> &nbsp;|&nbsp; {"<"}60 or critical finding → <strong>BLOCK</strong></p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReleaseMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {createReleaseMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating & Running Tests…</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Create & Run Tests</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}