"use client";

import React, { useState } from "react";
import type { Project } from "@/lib/api/project";
import { useTestHistory } from "@/hooks/use-gate";
import { generateAiHelpForRun } from "@/lib/api/gate";
import { AiSuggestionCard } from "@/components/projects/ai-suggestion-card";
import {
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Loader2,
  Search,
  RefreshCw,
  Tag,
  GitBranch,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles,
} from "lucide-react";

interface TestHistoryTabProps {
  project: Project;
  onTriggerGateCheck?: () => void;
}

function timeAgo(iso?: string) {
  if (!iso) return "recently";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "PASSED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          PASSED
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          FAILED
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          RUNNING
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-card-border">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          PENDING
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-card-border">
          {status}
        </span>
      );
  }
}

function severityBadge(sev: string) {
  switch (sev?.toUpperCase()) {
    case "CRITICAL":
      return "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-805";
    case "HIGH":
    case "ERROR":
      return "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    case "MEDIUM":
    case "WARNING":
      return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    default:
      return "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  }
}

export function TestHistoryTab({ project, onTriggerGateCheck }: TestHistoryTabProps) {
  const { data: testRuns = [], isLoading, error, refetch, isFetching } = useTestHistory(project.id);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [generatingAiRunId, setGeneratingAiRunId] = useState<string | null>(null);

  const handleGenerateAi = async (runId: string) => {
    try {
      setGeneratingAiRunId(runId);
      await generateAiHelpForRun(project.id, runId);
      await refetch();
    } catch (err) {
      console.error("Failed to generate AI help:", err);
    } finally {
      setGeneratingAiRunId(null);
    }
  };

  const filtered = testRuns.filter((tr) => {
    const matchesType = filterType === "ALL" || tr.type === filterType;
    const matchesStatus = filterStatus === "ALL" || tr.status === filterStatus;
    const matchesSearch =
      search === "" ||
      (tr.releaseVersion && tr.releaseVersion.toLowerCase().includes(search.toLowerCase())) ||
      (tr.branch && tr.branch.toLowerCase().includes(search.toLowerCase())) ||
      tr.id.toLowerCase().includes(search.toLowerCase()) ||
      tr.type.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalRuns = testRuns.length;
  const passedRuns = testRuns.filter((r) => r.status === "PASSED").length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;
  const totalFindings = testRuns.reduce((acc, r) => acc + (r.findingsCount || 0), 0);
  const perfRuns = testRuns.filter((r) => r.type === "PERFORMANCE" && r.metrics && r.metrics.length > 0);
  const avgP95 =
    perfRuns.length > 0
      ? Math.round(
          perfRuns.reduce((acc, r) => {
            const m = r.metrics?.find((met) => met.metricName === "RESPONSE_TIME");
            return acc + (m?.currentValue ? Number(m.currentValue) : 0);
          }, 0) / perfRuns.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Automated Test Execution History</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5850ec] dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
              Live Audits
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Complete telemetry of security scans (Semgrep) and performance load checks (k6) executed on releases and on-demand.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-card-border bg-card hover:bg-muted text-foreground transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {onTriggerGateCheck && (
            <button
              onClick={onTriggerGateCheck}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#5850ec] hover:bg-[#4d44e7] text-white shadow-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trigger Gate Check</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-card-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Test Runs</span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalRuns}</span>
            <span className="text-[11px] text-muted-foreground">audits logged</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-card-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Gate Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{passRate}%</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{passedRuns} passed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-card-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Vulnerabilities Logged</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalFindings}</span>
            <span className="text-[11px] text-muted-foreground">findings across runs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-card-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Avg p95 Latency</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">
              {avgP95 !== null ? `${avgP95}ms` : "—"}
            </span>
            <span className="text-[11px] text-muted-foreground">k6 SLA target: 800ms</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Controls */}
      <div className="bg-card p-3.5 rounded-2xl border border-card-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-muted p-1 rounded-xl text-xs font-medium border border-card-border">
            {(["ALL", "SECURITY", "PERFORMANCE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === t
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "ALL" ? "All Tests" : t === "SECURITY" ? "Security (SAST)" : "Performance (k6)"}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-muted p-1 rounded-xl text-xs font-medium border border-card-border">
            {(["ALL", "PASSED", "FAILED", "RUNNING"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  filterStatus === s
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All Status" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search version, branch, ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-input-bg border border-input-border text-foreground rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5850ec]/30 focus:border-[#5850ec]"
          />
        </div>
      </div>

      {/* 4. Test Runs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-[#5850ec] animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Loading test execution telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-2">
          <AlertOctagon className="w-8 h-8 text-red-500 mx-auto" />
          <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Failed to load test history</h4>
          <p className="text-xs text-red-700 dark:text-red-300 max-w-sm mx-auto">{(error as Error).message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-card-border text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
            <Shield className="w-6 h-6 text-[#5850ec] dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">No test runs recorded yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Tests run automatically whenever a new release is created, or when you click &quot;Trigger Gate Check&quot;.
            </p>
          </div>
          {onTriggerGateCheck && (
            <button
              onClick={onTriggerGateCheck}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#5850ec] hover:bg-[#4d44e7] text-white shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run First Gate Check</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((run) => {
            const isExpanded = expandedRunId === run.id;
            const isSecurity = run.type === "SECURITY";
            const isPerf = run.type === "PERFORMANCE";

            return (
              <div
                key={run.id}
                className="bg-card rounded-2xl border border-card-border shadow-xs overflow-hidden transition-all hover:border-zinc-400 dark:hover:border-zinc-600"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSecurity
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200/70 dark:border-purple-800"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-800"
                      }`}
                    >
                      {isSecurity ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {isSecurity ? "Semgrep SAST Security Check" : "Grafana k6 Performance Check"}
                        </span>
                        {statusBadge(run.status)}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                        {run.releaseVersion && (
                          <span className="flex items-center gap-1 font-mono text-foreground bg-muted px-1.5 py-0.5 rounded border border-card-border">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            {run.releaseVersion}
                          </span>
                        )}
                        {run.branch && (
                          <span className="flex items-center gap-1 font-mono text-muted-foreground">
                            <GitBranch className="w-3 h-3 text-muted-foreground" />
                            {run.branch}
                          </span>
                        )}
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>
                          Run ID: <span className="font-mono text-muted-foreground">{run.id.slice(0, 8)}...</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-bold text-foreground">
                        {isSecurity ? (
                          run.findingsCount > 0 ? (
                            <span className="text-red-600 dark:text-red-400">{run.findingsCount} findings</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0 findings</span>
                          )
                        ) : (
                          `${run.passedTests} / ${run.totalTests} assertions`
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}</span>
                        <span>•</span>
                        <span>{timeAgo(run.completedAt || run.startedAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRunId(isExpanded ? null : run.id);
                      }}
                      className="p-1.5 rounded-lg bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="border-t border-card-border bg-muted/30 p-5 space-y-4 text-xs animate-in fade-in duration-150">
                    {/* Summary Message / Logs */}
                    {run.logs && (
                      <div className="p-3 bg-card rounded-xl border border-card-border text-foreground text-xs">
                        <span className="font-semibold text-foreground block mb-0.5">Execution Summary:</span>
                        <p className="leading-relaxed text-muted-foreground">{run.logs}</p>
                      </div>
                    )}

                    {/* Local Ollama AI Diagnostics & Remediation */}
                    <AiSuggestionCard
                      suggestion={run.aiSuggestion}
                      model={run.aiModel || "qwen2.5-coder:7b"}
                      onRegenerate={() => handleGenerateAi(run.id)}
                      isRegenerating={generatingAiRunId === run.id}
                    />

                    {/* Security Findings Section */}
                    {isSecurity && run.findings && run.findings.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-red-500" />
                            Detected Security Findings ({run.findings.length})
                          </h5>
                        </div>

                        <div className="space-y-2">
                          {run.findings.map((f) => (
                            <div
                              key={f.id}
                              className="p-3.5 rounded-xl bg-card border border-card-border shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-foreground">{f.title}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadge(f.severity)}`}>
                                  {f.severity}
                                </span>
                              </div>

                              {f.filePath && (
                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                                  <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>
                                    {f.filePath}
                                    {f.lineNumber ? `:${f.lineNumber}` : ""}
                                  </span>
                                </div>
                              )}

                              {f.description && (
                                <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>
                              )}

                              {f.remediation && (
                                <div className="mt-1 pt-1.5 border-t border-card-border text-[11px] text-[#5850ec] dark:text-indigo-400 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                  <span>Guidance: {f.remediation}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Metrics Section */}
                    {isPerf && run.metrics && run.metrics.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Performance Metrics & SLA Thresholds
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {run.metrics.map((m) => (
                            <div key={m.id} className="p-3 rounded-xl bg-card border border-card-border">
                              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                                {m.metricName}
                              </span>
                              <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-base font-bold text-foreground font-mono">
                                  {Number(m.currentValue).toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">{m.unit}</span>
                              </div>
                              {m.threshold && (
                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                  Threshold: {Number(m.threshold).toFixed(1)} {m.unit}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assertion Checks List */}
                    {run.results && run.results.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-foreground text-xs block">Assertion Checks:</span>
                        <div className="divide-y divide-card-border bg-card rounded-xl border border-card-border">
                          {run.results.map((res) => (
                            <div key={res.id} className="p-2.5 flex items-center justify-between text-xs">
                              <span className="text-foreground font-medium">{res.testName}</span>
                              {res.status === "PASSED" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Pass
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Fail
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
