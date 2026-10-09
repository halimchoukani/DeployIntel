"use client";

import React from "react";
import type { Project } from "@/lib/api/project";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  GitCommit, 
  Layers, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Server
} from "lucide-react";

interface OverviewTabProps {
  project: Project;
  onOpenAnalysis: () => void;
  onNavigateToTab: (tab: string) => void;
}

export function OverviewTab({ project, onOpenAnalysis, onNavigateToTab }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Live Verification Flow Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Live Deployment Verification Pipeline
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Active stage for latest commit <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-mono text-[11px]">e4b281f</code> on <span className="font-medium text-zinc-700">{project.defaultBranch || "main"}</span>
            </p>
          </div>
          <button
            onClick={onOpenAnalysis}
            className="self-start sm:self-auto text-xs font-semibold text-[#5850ec] hover:text-[#4d44e7] bg-indigo-50/80 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>Run Pipeline Simulation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Step 1 */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">Step 1 • Ingest</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Passed
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-800">AST & Git Diff</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">14 files modified (+328 / -42)</p>
            <div className="mt-3 pt-2 border-t border-zinc-200/60 text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Duration</span>
              <span className="font-mono text-zinc-600 font-medium">320ms</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">Step 2 • Model</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Passed
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-800">AI Risk Scoring</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Confidence 99.1% • Score: 18</p>
            <div className="mt-3 pt-2 border-t border-zinc-200/60 text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Duration</span>
              <span className="font-mono text-zinc-600 font-medium">840ms</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">Step 3 • Telemetry</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Passed
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-800">Canary Drift Guard</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">5xx Error Rate 0.01% (Safe)</p>
            <div className="mt-3 pt-2 border-t border-zinc-200/60 text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Duration</span>
              <span className="font-mono text-zinc-600 font-medium">620ms</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Verdict</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                ALLOWED
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-900">Firewall Gate Released</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Automated release to Production</p>
            <div className="mt-3 pt-2 border-t border-emerald-200/80 text-[10px] text-emerald-700/80 flex items-center justify-between font-medium">
              <span>Total Latency</span>
              <span className="font-mono text-emerald-900 font-bold">1.78s</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Environments Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Environment Topology</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Deployment health and active versions across cluster targets</p>
          </div>
          <button
            onClick={() => onNavigateToTab("deployments")}
            className="text-xs font-semibold text-[#5850ec] hover:underline"
          >
            All Deployments →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Production */}
          <div className="border border-zinc-200 rounded-xl p-4.5 bg-zinc-50/40 hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-xs font-bold text-zinc-900">Production</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                100% Traffic
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span className="text-zinc-400">Release</span>
                <span className="font-mono font-semibold text-zinc-800">v2.4.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Commit</span>
                <span className="font-mono text-zinc-600">e4b281f</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Gate Verdict</span>
                <span className="font-semibold text-emerald-600">ALLOWED (Score 18)</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Updated 8m ago</span>
              <span className="text-emerald-600 font-medium">99.99% Uptime</span>
            </div>
          </div>

          {/* Staging */}
          <div className="border border-zinc-200 rounded-xl p-4.5 bg-zinc-50/40 hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
                <span className="text-xs font-bold text-zinc-900">Staging (Canary)</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                15% Canary
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span className="text-zinc-400">Release</span>
                <span className="font-mono font-semibold text-zinc-800">v2.5.0-rc2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Commit</span>
                <span className="font-mono text-zinc-600">77fa9c0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Gate Verdict</span>
                <span className="font-semibold text-blue-600">EVALUATING</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Updated 22m ago</span>
              <span className="text-zinc-600 font-medium">Telemetry syncing</span>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-zinc-200 rounded-xl p-4.5 bg-zinc-50/40 hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-xs" />
                <span className="text-xs font-bold text-zinc-900">Ephemeral Preview</span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                PR #84
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span className="text-zinc-400">Branch</span>
                <span className="font-mono text-zinc-800">feat/redis-cache</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Commit</span>
                <span className="font-mono text-zinc-600">3a19b88</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Gate Verdict</span>
                <span className="font-semibold text-emerald-600">ALLOWED (Score 12)</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Updated 1h ago</span>
              <span className="text-zinc-600 font-medium">Auto-teardown in 4h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two Columns: Risk Factors & Active Guardrail Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors Breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">AI Risk Factor Breakdown</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Machine learning scoring weights for this project</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Safe Profile
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-zinc-700">Code Churn & Complexity</span>
                  <span className="font-semibold text-zinc-900">14% (Low)</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "14%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-zinc-700">Database & DDL Migration Risk</span>
                  <span className="font-semibold text-zinc-900">0% (None detected)</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "0%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-zinc-700">Historical Incident Pattern Similarity</span>
                  <span className="font-semibold text-zinc-900">6% (Negligible)</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "6%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-zinc-700">Flaky Test & Coverage Delta</span>
                  <span className="font-semibold text-zinc-900">8% (Within limits)</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "8%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Aggregate ML Model: <strong className="text-zinc-800">DeployIntel-v4-Transformer</strong></span>
            <button
              onClick={() => onNavigateToTab("insights")}
              className="text-xs font-semibold text-[#5850ec] hover:underline"
            >
              Blast Radius Map →
            </button>
          </div>
        </div>

        {/* Active Guardrail Policies */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Enforced Guardrail Policies</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Automated verdicts tripping deployment gates</p>
              </div>
              <button
                onClick={() => onNavigateToTab("policies")}
                className="text-xs font-semibold text-[#5850ec] hover:underline"
              >
                Configure →
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-800">Pre-Flight AI Risk Gate</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ENFORCING
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Automatically blocks any deployment scoring above 65 risk points.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-800">Canary Drift Auto-Rollback</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ENFORCING
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Triggers immediate rollback if 5xx error rate spikes above 0.5% in 3 mins.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-800">Secret & Credential Sanitizer</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ENFORCING
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Scans commit diffs for exposed JWTs, AWS credentials, and SSH keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
            <span>Quarantine status: <strong className="text-emerald-700">No active blocks</strong></span>
            <span className="text-zinc-400">All 5 policies passing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
