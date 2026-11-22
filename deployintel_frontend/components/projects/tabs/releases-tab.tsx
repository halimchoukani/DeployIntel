"use client";

import React, { useState, useEffect } from "react";
import { useReleases, useCreateRelease } from "@/hooks/use-releases";
import type { Release, ReleaseEnvironment, ReleaseStatus } from "@/lib/api/releases";
import type { Project } from "@/lib/api/project";
import { AiSuggestionCard } from "@/components/projects/ai-suggestion-card";
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
    PRODUCTION: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
    STAGING: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    DEVELOPMENT: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
  };
  return map[env] ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700";
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
    SUCCESS: { label: "Success", cls: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800" },
    FAILED:  { label: "Failed",  cls: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800" },
    BLOCKED: { label: "Blocked", cls: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800" },
    DRAFT:   { label: "Draft",   cls: "text-muted-foreground bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" },
    PENDING: { label: "Pending", cls: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800" },
  };
  const s = map[status] ?? { label: status, cls: "text-muted-foreground bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" };
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Gates Passed
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          Gate Blocked
        </span>
      );
    case "RUNNING":
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          Running Tests...
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-zinc-400 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CircleCheckBig className="w-3.5 h-3.5" />
          PASS
        </span>
      );
    case "WARN":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <TriangleAlert className="w-3.5 h-3.5" />
          WARN
        </span>
      );
    case "BLOCK":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
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

  // Reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Live region for score announcements
  const [announcedScore, setAnnouncedScore] = useState(score);
  useEffect(() => {
    setAnnouncedScore(score);
  }, [score]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Live region for screen readers - announces score changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        Risk score: {Math.round(pct)}. Risk level: {risk.level}. {risk.desc}
      </div>

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
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
            strokeDashoffset={prefersReducedMotion ? circumference - (pct / 100) * circumference : offset}
            style={{
              transition: prefersReducedMotion ? "none" : "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
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
            risk.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" :
            risk.color === "amber" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" :
            risk.color === "orange" ? "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800" :
            "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <risk.icon className="w-3 h-3" aria-hidden="true" />
          {risk.desc}
        </span>
      </div>
    </div>
  );
}

/** Horizontal sub-score bar with better visual design (Bullet Chart style) */
function ScoreBar({ label, value, icon, weight }: { label: string; value: number; icon: React.ReactNode; weight?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : pct >= 40 ? "bg-orange-400" : "bg-red-500";

  const labelColor =
    pct >= 80 ? "text-emerald-700" : pct >= 60 ? "text-amber-700" : pct >= 40 ? "text-orange-700" : "text-red-700";

  const bgColor =
    pct >= 80 ? "bg-emerald-50" : pct >= 60 ? "bg-amber-50" : pct >= 40 ? "bg-orange-50" : "bg-red-50";

  // Bullet chart ranges
  const poorEnd = 40;
  const fairEnd = 60;
  const goodEnd = 80;

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

      {/* Bullet Chart with qualitative ranges */}
      <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
        {/* Qualitative ranges (poor/fair/good) */}
        <div className="absolute inset-0 flex">
          <div className="bg-red-100" style={{ width: `${poorEnd}%` }} />
          <div className="bg-amber-100" style={{ width: `${fairEnd - poorEnd}%` }} />
          <div className="bg-emerald-100" style={{ width: `${goodEnd - fairEnd}%` }} />
          <div className="bg-emerald-50" style={{ width: `${100 - goodEnd}%` }} />
        </div>

        {/* Performance bar */}
        <div
          className={`absolute top-0 bottom-0 h-full rounded-full ${barColor} transition-all duration-700 ease-out shadow-sm`}
          style={{ width: `${pct}%`, zIndex: 2 }}
        />

        {/* Target markers at 60% (WARN) and 80% (PASS) */}
        <div
          className="absolute top-0 bottom-0 w-px bg-amber-500/60"
          style={{ left: `${fairEnd}%`, zIndex: 3 }}
          title="WARN threshold (60)"
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-emerald-500/60"
          style={{ left: `${goodEnd}%`, zIndex: 3 }}
          title="PASS threshold (80)"
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between text-[9px] text-zinc-400">
        <span>Critical {"<"}40</span>
        <span>High 40–59</span>
        <span>Medium 60–79</span>
        <span>Low ≥80</span>
      </div>
    </div>
  );
}

/** Compact bullet chart for inline use */
function CompactBulletChart({ score, label, weight }: { score: number; label: string; weight?: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? "emerald" : pct >= 60 ? "amber" : pct >= 40 ? "orange" : "red";
  const barColor = `bg-${color}-500`;
  const trackColor = `bg-${color}-100`;

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <span className="text-[11px] font-medium text-zinc-600 w-24 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 bottom-0 w-px bg-amber-500/60" style={{ left: '60%' }} />
        <div className="absolute top-0 bottom-0 w-px bg-emerald-500/60" style={{ left: '80%' }} />
      </div>
      <span className={`text-[11px] font-bold text-${color}-600 w-8 text-right`}>{Math.round(pct)}</span>
      {weight && <span className="text-[10px] text-zinc-400 font-mono w-12 text-right">{weight}</span>}
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

  const riskLevel = pct >= 80 ? "LOW" : pct >= 60 ? "MEDIUM" : pct >= 40 ? "HIGH" : "CRITICAL";
  const riskDesc = pct >= 80 ? "Safe to deploy" : pct >= 60 ? "Review recommended" : pct >= 40 ? "Significant risk" : "Do not deploy";

  return (
    <article className="bg-card border border-card-border rounded-xl p-4 hover:border-muted-foreground/30 transition-colors" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-label`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : color === "amber" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" : color === "orange" ? "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400" : "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 id={`${title.toLowerCase().replace(/\s+/g, '-')}-label`} className="text-sm font-semibold text-foreground">
              {title}
            </h5>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-bold ${color === "emerald" ? "text-emerald-600" : color === "amber" ? "text-amber-600" : color === "orange" ? "text-orange-600" : "text-red-600"}`}
                aria-label={`Score: ${Math.round(pct)} out of 100`}
              >
                {Math.round(pct)}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${color === "emerald" ? "bg-emerald-50 text-emerald-700" : color === "amber" ? "bg-amber-50 text-amber-700" : color === "orange" ? "bg-orange-50 text-orange-700" : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}
                aria-label={`Risk level: ${riskLevel}`}
              >
                {riskLevel}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          {weight && (
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-50 rounded">
              Weight: {weight}
            </span>
          )}
          {findings && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]" aria-label="Finding counts by severity">
              {findings.critical > 0 && <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800 font-medium">{findings.critical} Critical</span>}
              {findings.high > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800 font-medium">{findings.high} High</span>}
              {findings.medium > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 font-medium">{findings.medium} Medium</span>}
              {findings.low > 0 && <span className="px-1.5 py-0.5 rounded bg-zinc-50 text-foreground font-medium">{findings.low} Low</span>}
              {(findings.critical + findings.high + findings.medium + findings.low) === 0 && (
                <span className="text-zinc-400">No findings</span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
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
        <p className="text-xs text-muted-foreground font-medium">Loading releases…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-sm font-semibold text-foreground">Could not load releases</p>
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
          <p className="text-sm font-bold text-foreground">No releases yet</p>
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
          <h3 className="text-sm font-bold text-foreground">Release History & Gate Evaluations</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {releases.length} release{releases.length !== 1 ? "s" : ""} recorded • Composite risk score drives PASS / BLOCK decisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg p-1 border border-card-border">
            {(["ALL", "PRODUCTION", "STAGING", "DEVELOPMENT"] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvFilter(env)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  envFilter === env
                    ? "bg-card text-[#5850ec] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
      <div className="bg-card text-foreground rounded-2xl border border-card-border shadow-xs overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border bg-muted/40 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
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
          <tbody className="divide-y divide-card-border">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(release);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for release ${release.versionNumber}, risk score ${release.compositeScore != null ? Math.round(release.compositeScore) : 'not available'}, ${release.deploymentDecision || release.testVerdict || 'pending'}`}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:ring-offset-2 focus:ring-offset-white"
                >
                  {/* Version */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Tag className="w-3.5 h-3.5 text-[#5850ec]" />
                      </div>
                      <span className="font-bold text-foreground">{release.versionNumber}</span>
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
                              risk.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" :
                              risk.color === "amber" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" :
                              risk.color === "orange" ? "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800" :
                              "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
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
                    <div className="flex items-center gap-1.5 text-muted-foreground">
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
                      className="text-xs font-semibold text-[#5850ec] hover:text-[#4d44e7] p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-modal-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelected(null);
            }
          }}
        >
          {/* Focus trap */}
          <div tabIndex={-1} className="sr-only" aria-hidden="true" />
          <div
            className="bg-card text-foreground rounded-2xl border border-card-border shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            ref={(el) => {
              if (el) {
                el.focus();
                // Trap focus within modal
                const focusableElements = el.querySelectorAll(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                const handleTab = (e: KeyboardEvent) => {
                  if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstElement) {
                      e.preventDefault();
                      lastElement?.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                      e.preventDefault();
                      firstElement?.focus();
                    }
                  }
                };
                el.addEventListener('keydown', handleTab);
                return () => el.removeEventListener('keydown', handleTab);
              }
            }}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-card-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center" aria-hidden="true">
                  <Tag className="w-5 h-5 text-[#5850ec]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Release Overview</p>
                  <h2 id="release-modal-title" className="text-base font-bold text-foreground">{selected.versionNumber}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:ring-offset-2"
                aria-label="Close release details"
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
                        <span className="text-xs font-bold text-foreground">Composite Risk Score</span>
                        {decisionBadge(selected.deploymentDecision)}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {selected.decisionReason ?? "Risk assessment completed."}
                      </p>

                      {/* Formula & thresholds */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded border border-card-border">
                          composite = sec×0.40 + perf×0.35 + tests×0.15 + reg×0.10
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">≥80 PASS</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 font-medium">60–79 WARN</span>
                        <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800 font-medium">{"<"}60 BLOCK</span>
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
              <div className="rounded-2xl border border-card-border bg-muted/30 p-4 flex items-center gap-3">
                {selected.status === "PENDING" ? (
                  <>
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Gate checks in progress…</p>
                      <p className="text-[11px] text-zinc-400">Composite risk score will appear once both Semgrep and k6 tests complete.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">No risk score available</p>
                      <p className="text-[11px] text-zinc-400">Gate checks may not have run for this release.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Detailed Risk Factor Cards ───────────────────────────────────── */}
            {selected.compositeScore != null && (
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
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

            {/* Local Ollama Release Gate Advisory */}
            {selected.aiSuggestion && (
              <div className="pt-1">
                <AiSuggestionCard
                  suggestion={selected.aiSuggestion}
                  title="Ollama AI Release Advisory & Risk Mitigation"
                />
              </div>
            )}

            {/* Release metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-100">
              <div className="bg-muted/40 p-3 rounded-xl border border-card-border">
                <p className="text-zinc-400 font-medium mb-1">Release Status</p>
                {statusLabel(selected.status)}
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-card-border">
                <p className="text-zinc-400 font-medium mb-1">Gate Check State</p>
                {testVerdictBadge(selected.testVerdict)}
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-card-border">
                <p className="text-zinc-400 font-medium mb-1">Environment</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${envBadge(selected.environment)}`}>
                  {selected.environment.charAt(0) + selected.environment.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-card-border">
                <p className="text-zinc-400 font-medium mb-1">Commit SHA</p>
                <span className="font-mono text-[11px] text-foreground break-all">{selected.commitSha}</span>
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-card-border">
                <p className="text-zinc-400 font-medium mb-1">Branch</p>
                <span className="font-mono text-foreground">{selected.branch ?? "—"}</span>
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-card-border">
                <p className="text-zinc-400 font-medium mb-1">Released</p>
                <span className="text-foreground">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Test Runs */}
            {selected.testRuns && selected.testRuns.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#5850ec]" />
                  Executed Automated Gate Checks:
                </h4>
                <div className="divide-y divide-card-border bg-zinc-50 rounded-xl border border-zinc-200/70">
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
                          <span className="font-semibold text-foreground">
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
                  className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors"
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
          <div className="bg-card text-foreground rounded-2xl border border-card-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#5850ec]" />
                <h3 className="text-sm font-bold text-foreground">Create New Release</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
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
                <label className="block font-semibold text-foreground mb-1">Version Number *</label>
                <input
                  type="text"
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="e.g. v2.1.0"
                  className="w-full px-3 py-2 bg-muted/40 border border-card-border text-foreground rounded-xl text-xs focus:ring-2 focus:ring-[#5850ec]/30 focus:border-[#5850ec]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Target Environment *</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as ReleaseEnvironment)}
                  className="w-full px-3 py-2 bg-muted/40 border border-card-border text-foreground rounded-xl text-xs focus:ring-2 focus:ring-[#5850ec]/30 focus:border-[#5850ec]"
                >
                  <option value="PRODUCTION">Production</option>
                  <option value="STAGING">Staging</option>
                  <option value="DEVELOPMENT">Development</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3 py-2 bg-muted/40 border border-card-border text-foreground rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Commit SHA</label>
                  <input
                    type="text"
                    value={commitSha}
                    onChange={(e) => setCommitSha(e.target.value)}
                    placeholder="e.g. 7f9a2b1"
                    className="w-full px-3 py-2 bg-muted/40 border border-card-border text-foreground rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Scoring info panel */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-600 dark:text-indigo-400 space-y-1">
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
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors"
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