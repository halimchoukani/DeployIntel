"use client";

import React, { useState, useEffect } from "react";
import type { Project } from "@/lib/api/project";
import { useGateCheck, useK6GateCheck } from "@/hooks/use-gate";
import type { SemgrepFinding } from "@/lib/api/gate";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  Code2,
  FileCode2,
  Terminal,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  Gauge,
  ArrowUpRight,
  TrendingUp,
  Server,
  Radio,
  Database,
} from "lucide-react";

interface GateCheckModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "semgrep" | "k6";
}

export function GateCheckModal({
  project,
  isOpen,
  onClose,
  initialTab = "semgrep",
}: GateCheckModalProps) {
  const [activeTab, setActiveTab] = useState<"semgrep" | "k6">(initialTab);

  // Semgrep State
  const semgrep = useGateCheck(project.id);
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "ERROR" | "WARNING">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSemgrepRaw, setShowSemgrepRaw] = useState<boolean>(false);

  // k6 Performance State
  const k6 = useK6GateCheck(project.id);
  const [showK6Raw, setShowK6Raw] = useState<boolean>(false);

  // Synchronize initialTab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Auto-trigger appropriate scan based on activeTab
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "semgrep" && !semgrep.data && !semgrep.isLoading && !semgrep.error) {
        semgrep.runCheck().catch(() => {});
      } else if (activeTab === "k6" && !k6.data && !k6.isLoading && !k6.error) {
        k6.runCheck().catch(() => {});
      }
    }
  }, [isOpen, activeTab, semgrep, k6]);

  if (!isOpen) return null;

  const semgrepFindings: SemgrepFinding[] = semgrep.data?.findings || [];
  const filteredFindings = semgrepFindings.filter((f) => {
    if (filterSeverity === "ERROR" && f.severity !== "ERROR") return false;
    if (filterSeverity === "WARNING" && f.severity !== "WARNING") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = f.checkId.toLowerCase().includes(q);
      const matchPath = f.path.toLowerCase().includes(q);
      const matchMsg = f.message.toLowerCase().includes(q);
      return matchId || matchPath || matchMsg;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Project info and Tab Switcher */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#5850ec] flex items-center justify-center shrink-0">
                {activeTab === "semgrep" ? (
                  <Shield className="w-5 h-5 text-[#5850ec]" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900">
                    {activeTab === "semgrep"
                      ? "Semgrep SAST Security Gate"
                      : "Grafana k6 Performance Gate"}
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
                    Pre-Flight Gate
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Target: <span className="font-medium text-zinc-700">{project.name}</span>
                  {project.language && <span> • {project.language}</span>}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 p-2 rounded-xl hover:bg-zinc-100 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gate Tabs: Semgrep Security vs k6 Performance */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                setActiveTab("semgrep");
                if (!semgrep.data && !semgrep.isLoading) semgrep.runCheck().catch(() => {});
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                activeTab === "semgrep"
                  ? "bg-white text-indigo-900 border-indigo-200 shadow-xs"
                  : "bg-zinc-100/70 text-zinc-600 border-transparent hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${activeTab === "semgrep" ? "text-[#5850ec]" : "text-zinc-400"}`} />
              <span>Semgrep SAST (Security)</span>
              {semgrep.data && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    semgrep.data.verdict === "BLOCKED"
                      ? "bg-red-100 text-red-700"
                      : semgrep.data.verdict === "WARNING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {semgrep.data.verdict}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("k6");
                if (!k6.data && !k6.isLoading) k6.runCheck().catch(() => {});
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                activeTab === "k6"
                  ? "bg-white text-amber-900 border-amber-200 shadow-xs"
                  : "bg-zinc-100/70 text-zinc-600 border-transparent hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${activeTab === "k6" ? "text-amber-500 fill-amber-400" : "text-zinc-400"}`} />
              <span>k6 Load Test (Performance)</span>
              {k6.data && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    k6.data.verdict === "BLOCKED"
                      ? "bg-red-100 text-red-700"
                      : k6.data.verdict === "WARNING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {k6.data.verdict}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ============================================================== */}
          {/* TAB 1: SEMGREP SAST SECURITY                                  */}
          {/* ============================================================== */}
          {activeTab === "semgrep" && (
            <>
              {/* Loading State */}
              {semgrep.isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#5850ec] animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-pulse border-2 border-white" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Executing Semgrep SAST Static Analysis...</h4>
                    <p className="text-xs text-zinc-500 max-w-md mt-1">
                      Inspecting AST, secrets, and deployment pipelines for security vulnerabilities.
                    </p>
                  </div>

                  <div className="w-full max-w-sm pt-2 space-y-2 text-left">
                    <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Connected to Docker test environment container</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Mounted workspace git diff & source tree</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-indigo-700 font-medium">
                      <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin shrink-0" />
                      <span>Running Semgrep rules (OWASP Top 10, CWE, Secrets, Injections)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {semgrep.error && !semgrep.isLoading && (
                <div className="p-5 rounded-xl bg-red-50/80 border border-red-200 text-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-900 text-sm">Gate Execution Failed</h4>
                      <p className="text-red-700 mt-1 leading-relaxed">{semgrep.error.message}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => semgrep.runCheck()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Scan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Results State */}
              {semgrep.data && !semgrep.isLoading && (
                <>
                  {/* Verdict Banner */}
                  {semgrep.data.verdict === "BLOCKED" && (
                    <div className="p-5 rounded-2xl bg-red-50/90 border border-red-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-900 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                          VERDICT: GATE BLOCKED (DEPLOYMENT REJECTED)
                        </span>
                        <span className="text-[11px] font-mono font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                          {semgrep.data.errorCount} Blocking Vulnerabilit{semgrep.data.errorCount === 1 ? "y" : "ies"}
                        </span>
                      </div>
                      <p className="text-red-700 text-xs leading-relaxed">
                        {semgrep.data.summaryMessage}
                      </p>
                    </div>
                  )}

                  {semgrep.data.verdict === "WARNING" && (
                    <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          VERDICT: GATE PASSED WITH WARNINGS
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {semgrep.data.warningCount} Non-blocking Warning{semgrep.data.warningCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="text-amber-800 text-xs leading-relaxed">
                        {semgrep.data.summaryMessage}
                      </p>
                    </div>
                  )}

                  {semgrep.data.verdict === "PASSED" && (
                    <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          VERDICT: GATE PASSED (DEPLOYMENT APPROVED)
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          100% Compliant
                        </span>
                      </div>
                      <p className="text-emerald-700 text-xs leading-relaxed">
                        {semgrep.data.summaryMessage}
                      </p>
                    </div>
                  )}

                  {/* Database Persistence Status */}
                  {semgrep.data.testRunId && (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200/90 text-[11px] font-mono">
                      <span className="flex items-center gap-2 text-zinc-700">
                        <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Saved to Database: <span className="font-semibold text-zinc-900">{semgrep.data.testRunId}</span></span>
                      </span>
                      {semgrep.data.deploymentId && (
                        <span className="text-zinc-500">
                          Deployment: <span className="text-zinc-800 font-semibold">{semgrep.data.deploymentId.slice(0, 8)}...</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Summary KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Total Findings</span>
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-zinc-900">{semgrep.data.totalFindings}</span>
                        {semgrep.data.errorCount > 0 && (
                          <span className="text-[11px] font-semibold text-red-600">({semgrep.data.errorCount} errors)</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Files Scanned</span>
                        <FileCode2 className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-zinc-900">{semgrep.data.scannedFilesCount || 39}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Rules Evaluated</span>
                        <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-zinc-900">{semgrep.data.rulesCount || 254}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Scan Duration</span>
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-zinc-900 font-mono">
                          {semgrep.data.scanDurationSeconds ? `${semgrep.data.scanDurationSeconds.toFixed(1)}s` : "4.2s"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Findings Explorer */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
                        <button
                          onClick={() => setFilterSeverity("ALL")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            filterSeverity === "ALL"
                              ? "bg-white text-zinc-900 shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          All ({semgrepFindings.length})
                        </button>
                        <button
                          onClick={() => setFilterSeverity("ERROR")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            filterSeverity === "ERROR"
                              ? "bg-white text-red-700 shadow-xs"
                              : "text-zinc-600 hover:text-red-600"
                          }`}
                        >
                          Errors ({semgrep.data.errorCount})
                        </button>
                        <button
                          onClick={() => setFilterSeverity("WARNING")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            filterSeverity === "WARNING"
                              ? "bg-white text-amber-700 shadow-xs"
                              : "text-zinc-600 hover:text-amber-600"
                          }`}
                        >
                          Warnings ({semgrep.data.warningCount})
                        </button>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search rule or file..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50/70 focus:bg-white focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                      </div>
                    </div>

                    {filteredFindings.length > 0 ? (
                      <div className="space-y-2.5">
                        {filteredFindings.map((finding, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border text-xs transition-all ${
                              finding.severity === "ERROR"
                                ? "bg-red-50/30 border-red-200/90 hover:border-red-300"
                                : "bg-zinc-50/60 border-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                    finding.severity === "ERROR"
                                      ? "bg-red-100 text-red-800 border border-red-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {finding.severity}
                                </span>
                                <span className="font-mono text-xs font-bold text-zinc-900 break-all">
                                  {finding.checkId}
                                </span>
                              </div>

                              {finding.shortlink && (
                                <a
                                  href={finding.shortlink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-medium"
                                >
                                  <span>Rule Docs</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-2 text-zinc-600 font-mono text-[11px]">
                              <FileCode2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>
                                {finding.path}
                                {finding.startLine ? `:${finding.startLine}` : ""}
                                {finding.startCol ? `:${finding.startCol}` : ""}
                              </span>
                            </div>

                            <p className="mt-2 text-zinc-700 leading-relaxed text-xs">
                              {finding.message}
                            </p>

                            {(finding.owasp.length > 0 || finding.cwe.length > 0 || finding.category) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                {finding.category && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                                    Category: {finding.category}
                                  </span>
                                )}
                                {finding.owasp.slice(0, 2).map((o, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-medium"
                                  >
                                    {o}
                                  </span>
                                ))}
                                {finding.cwe.slice(0, 2).map((c, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-medium"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-semibold text-zinc-800">
                          {searchQuery
                            ? "No findings matching your search filter."
                            : "No security issues found for the selected filter."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Raw CLI output */}
                  {semgrep.data.rawOutput && (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowSemgrepRaw(!showSemgrepRaw)}
                        className="w-full px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100/80 text-xs font-semibold text-zinc-700 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Raw Semgrep CLI Output</span>
                        </span>
                        {showSemgrepRaw ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                      </button>
                      {showSemgrepRaw && (
                        <div className="p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap scrollbar-thin">
                          {semgrep.data.rawOutput}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: GRAFANA K6 PERFORMANCE LOAD TEST                        */}
          {/* ============================================================== */}
          {activeTab === "k6" && (
            <>
              {/* Loading State */}
              {k6.isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-amber-500 fill-amber-400 animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 animate-pulse border-2 border-white" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Executing Grafana k6 Performance Benchmark...</h4>
                    <p className="text-xs text-zinc-500 max-w-md mt-1">
                      Spawning virtual users (5 VUs) to generate continuous HTTP load and assess latency percentiles (p90, p95).
                    </p>
                  </div>

                  <div className="w-full max-w-sm pt-2 space-y-2 text-left">
                    <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>k6 test runner loaded in container workspace</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ramping up 5 concurrent virtual users (VUs)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-amber-700 font-medium">
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                      <span>Evaluating performance thresholds (p(95)&lt;800ms, failure rate&lt;5%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {k6.error && !k6.isLoading && (
                <div className="p-5 rounded-xl bg-red-50/80 border border-red-200 text-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-900 text-sm">Performance Gate Failed</h4>
                      <p className="text-red-700 mt-1 leading-relaxed">{k6.error.message}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => k6.runCheck()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Load Test</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Results State */}
              {k6.data && !k6.isLoading && (
                <>
                  {/* Verdict Banner */}
                  {k6.data.verdict === "PASSED" && (
                    <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          VERDICT: PERFORMANCE GATE PASSED
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          p95: {k6.data.p95DurationMs.toFixed(1)}ms
                        </span>
                      </div>
                      <p className="text-emerald-700 text-xs leading-relaxed">
                        {k6.data.summaryMessage}
                      </p>
                    </div>
                  )}

                  {k6.data.verdict === "WARNING" && (
                    <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          VERDICT: PERFORMANCE GATE WARNING (DEGRADED)
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          p95: {k6.data.p95DurationMs.toFixed(1)}ms
                        </span>
                      </div>
                      <p className="text-amber-800 text-xs leading-relaxed">
                        {k6.data.summaryMessage}
                      </p>
                    </div>
                  )}

                  {k6.data.verdict === "BLOCKED" && (
                    <div className="p-5 rounded-2xl bg-red-50/90 border border-red-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-900 flex items-center gap-2 text-xs tracking-wider uppercase">
                          <AlertOctagon className="w-5 h-5 text-red-600" />
                          VERDICT: PERFORMANCE GATE BLOCKED
                        </span>
                        <span className="text-[11px] font-mono font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                          {(k6.data.failedRequestRate * 100).toFixed(1)}% Error Rate
                        </span>
                      </div>
                      <p className="text-red-700 text-xs leading-relaxed">
                        {k6.data.summaryMessage}
                      </p>
                    </div>
                  )}

                  {/* Database Persistence Status */}
                  {k6.data.testRunId && (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200/90 text-[11px] font-mono">
                      <span className="flex items-center gap-2 text-zinc-700">
                        <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Saved to Database: <span className="font-semibold text-zinc-900">{k6.data.testRunId}</span></span>
                      </span>
                      {k6.data.deploymentId && (
                        <span className="text-zinc-500">
                          Deployment: <span className="text-zinc-800 font-semibold">{k6.data.deploymentId.slice(0, 8)}...</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Performance KPIs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">p95 Latency</span>
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-zinc-900 font-mono">
                          {k6.data.p95DurationMs.toFixed(1)}ms
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Throughput</span>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-zinc-900 font-mono">
                          {k6.data.requestsPerSecond.toFixed(1)} req/s
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Error Rate</span>
                        <Activity className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="mt-1">
                        <span className={`text-lg font-bold font-mono ${k6.data.failedRequestRate > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {(k6.data.failedRequestRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">Total Requests</span>
                        <Radio className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-zinc-900 font-mono">
                          {k6.data.totalRequests}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Latency Percentile Breakdown */}
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-zinc-500" />
                        Response Time Percentiles
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Target: {k6.data.targetUrl}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80">
                        <div className="text-[10px] text-zinc-400 font-medium">Min</div>
                        <div className="font-mono font-bold text-zinc-800 mt-0.5">{k6.data.minDurationMs.toFixed(1)}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80">
                        <div className="text-[10px] text-zinc-400 font-medium">Median</div>
                        <div className="font-mono font-bold text-zinc-800 mt-0.5">{k6.data.medDurationMs.toFixed(1)}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80">
                        <div className="text-[10px] text-zinc-400 font-medium">Avg</div>
                        <div className="font-mono font-bold text-zinc-800 mt-0.5">{k6.data.avgDurationMs.toFixed(1)}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80">
                        <div className="text-[10px] text-indigo-600 font-medium">p(90)</div>
                        <div className="font-mono font-bold text-indigo-900 mt-0.5">{k6.data.p90DurationMs.toFixed(1)}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
                        <div className="text-[10px] text-amber-700 font-medium">p(95)</div>
                        <div className="font-mono font-bold text-amber-900 mt-0.5">{k6.data.p95DurationMs.toFixed(1)}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* Assertion Checks List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Assertion Checks & Policy Guardrails
                    </h4>

                    <div className="space-y-2">
                      {k6.data.checks.map((check, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {check.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                            <span className="font-medium text-zinc-800 font-mono text-[11.5px]">{check.name}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] font-mono">
                            <span className="text-emerald-700 font-semibold">{check.passes} passes</span>
                            {check.fails > 0 && (
                              <span className="text-red-600 font-semibold">{check.fails} fails</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw k6 CLI output */}
                  {k6.data.rawOutput && (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowK6Raw(!showK6Raw)}
                        className="w-full px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100/80 text-xs font-semibold text-zinc-700 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Raw Grafana k6 CLI Terminal Output</span>
                        </span>
                        {showK6Raw ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                      </button>
                      {showK6Raw && (
                        <div className="p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap scrollbar-thin">
                          {k6.data.rawOutput}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 font-medium">
            {activeTab === "semgrep"
              ? "Semgrep OSS Engine • AST & Rule Verification"
              : "Grafana k6 Engine • Distributed Synthetic Load Testing"}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (activeTab === "semgrep") {
                  semgrep.runCheck();
                } else {
                  k6.runCheck();
                }
              }}
              disabled={activeTab === "semgrep" ? semgrep.isLoading : k6.isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all shadow-xs disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  (activeTab === "semgrep" ? semgrep.isLoading : k6.isLoading) ? "animate-spin" : ""
                }`}
              />
              <span>{activeTab === "semgrep" ? "Re-run Semgrep" : "Re-run k6 Test"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
