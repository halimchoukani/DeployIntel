"use client";

import React from "react";
import type { Project } from "@/lib/api/project";
import {
  CheckCircle2,
  ChevronRight,
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
      <div className="bg-card rounded-2xl border border-card-border p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Live Deployment Verification Pipeline
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active stage for latest commit <code className="bg-muted text-foreground px-1.5 py-0.5 rounded font-mono text-[11px] border border-card-border">e4b281f</code> on <span className="font-medium text-foreground">{project.defaultBranch || "main"}</span>
            </p>
          </div>
          <button
            onClick={onOpenAnalysis}
            className="self-start sm:self-auto text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/15 border border-accent/20 dark:bg-accent/20 dark:border-accent/30 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>Run Pipeline Simulation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Step 1 */}
          <div className="bg-muted/40 border border-card-border rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Step 1 • Ingest</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 dark:bg-success/20 dark:border-success/30">
                <CheckCircle2 className="w-3 h-3 text-success" />
                Passed
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">AST & Git Diff</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">14 files modified (+328 / -42)</p>
            <div className="mt-3 pt-2 border-t border-card-border text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Duration</span>
              <span className="font-mono text-foreground font-medium">320ms</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-muted/40 border border-card-border rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Step 2 • Model</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 dark:bg-success/20 dark:border-success/30">
                <CheckCircle2 className="w-3 h-3 text-success" />
                Passed
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">AI Risk Scoring</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Confidence 99.1% • Score: 18</p>
            <div className="mt-3 pt-2 border-t border-card-border text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Duration</span>
              <span className="font-mono text-foreground font-medium">840ms</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-muted/40 border border-card-border rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Step 3 • Telemetry</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 dark:bg-success/20 dark:border-success/30">
                <CheckCircle2 className="w-3 h-3 text-success" />
                Passed
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">Canary Drift Guard</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">5xx Error Rate 0.01% (Safe)</p>
            <div className="mt-3 pt-2 border-t border-card-border text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Duration</span>
              <span className="font-mono text-foreground font-medium">620ms</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-success/5 border border-success/20 dark:bg-success/10 dark:border-success/30 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-success uppercase">Verdict</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full border border-success/30 dark:bg-success/20 dark:border-success/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                ALLOWED
              </span>
            </div>
            <p className="text-xs font-bold text-success">Firewall Gate Released</p>
            <p className="text-[11px] text-success/80 mt-0.5">Automated release to Production</p>
            <div className="mt-3 pt-2 border-t border-success/20 dark:border-success/30 text-[10px] text-success/80 flex items-center justify-between font-medium">
              <span>Total Latency</span>
              <span className="font-mono text-success font-bold">1.78s</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Environments Grid */}
      <div className="bg-card rounded-2xl border border-card-border p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">Environment Topology</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Deployment health and active versions across cluster targets</p>
          </div>
          <button
            onClick={() => onNavigateToTab("deployments")}
            className="text-xs font-semibold text-accent hover:underline"
          >
            All Deployments →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Production */}
          <div className="border border-card-border rounded-xl p-4.5 bg-muted/40 hover:border-ring/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success shadow-xs" />
                <span className="text-xs font-bold text-foreground">Production</span>
              </div>
              <span className="text-[10px] font-semibold text-success bg-success/10 border border-success/20 dark:bg-success/20 dark:border-success/30 px-2 py-0.5 rounded-full">
                100% Traffic
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Release</span>
                <span className="font-mono font-semibold text-foreground">v2.4.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commit</span>
                <span className="font-mono text-muted-foreground">e4b281f</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gate Verdict</span>
                <span className="font-semibold text-success">ALLOWED (Score 18)</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-card-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Updated 8m ago</span>
              <span className="text-success font-medium">99.99% Uptime</span>
            </div>
          </div>

          {/* Staging */}
          <div className="border border-card-border rounded-xl p-4.5 bg-muted/40 hover:border-ring/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-info shadow-xs" />
                <span className="text-xs font-bold text-foreground">Staging (Canary)</span>
              </div>
              <span className="text-[10px] font-semibold text-info bg-info/10 border border-info/20 dark:bg-info/20 dark:border-info/30 px-2 py-0.5 rounded-full">
                15% Canary
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Release</span>
                <span className="font-mono font-semibold text-foreground">v2.5.0-rc2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commit</span>
                <span className="font-mono text-muted-foreground">77fa9c0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gate Verdict</span>
                <span className="font-semibold text-info">EVALUATING</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-card-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Updated 22m ago</span>
              <span className="text-muted-foreground font-medium">Telemetry syncing</span>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-card-border rounded-xl p-4.5 bg-muted/40 hover:border-ring/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-xs" />
                <span className="text-xs font-bold text-foreground">Ephemeral Preview</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-card-border px-2 py-0.5 rounded-full">
                PR #84
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-mono text-foreground">feat/redis-cache</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commit</span>
                <span className="font-mono text-muted-foreground">3a19b88</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gate Verdict</span>
                <span className="font-semibold text-success">ALLOWED (Score 12)</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-card-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Updated 1h ago</span>
              <span className="text-muted-foreground font-medium">Auto-teardown in 4h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two Columns: Risk Factors & Active Guardrail Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors Breakdown */}
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Risk Factor Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Machine learning scoring weights for this project</p>
              </div>
              <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/20 dark:bg-success/20 dark:border-success/30">
                Safe Profile
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">Code Churn & Complexity</span>
                  <span className="font-semibold text-foreground">14% (Low)</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-card-border">
                  <div className="bg-success h-full rounded-full" style={{ width: "14%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">Database & DDL Migration Risk</span>
                  <span className="font-semibold text-foreground">0% (None detected)</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-card-border">
                  <div className="bg-success h-full rounded-full" style={{ width: "0%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">Historical Incident Pattern Similarity</span>
                  <span className="font-semibold text-foreground">6% (Negligible)</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-card-border">
                  <div className="bg-success h-full rounded-full" style={{ width: "6%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">Flaky Test & Coverage Delta</span>
                  <span className="font-semibold text-foreground">8% (Within limits)</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-card-border">
                  <div className="bg-success h-full rounded-full" style={{ width: "8%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Aggregate ML Model: <strong className="text-foreground">DeployIntel-v4-Transformer</strong></span>
            <button
              onClick={() => onNavigateToTab("insights")}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Blast Radius Map →
            </button>
          </div>
        </div>

        {/* Active Guardrail Policies */}
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Enforced Guardrail Policies</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Automated verdicts tripping deployment gates</p>
              </div>
              <button
                onClick={() => onNavigateToTab("policies")}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Configure →
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-card-border">
                <div className="w-6 h-6 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Pre-Flight AI Risk Gate</p>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 dark:bg-success/20 dark:border-success/30">
                      ENFORCING
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Automatically blocks any deployment scoring above 65 risk points.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-card-border">
                <div className="w-6 h-6 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Canary Drift Auto-Rollback</p>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 dark:bg-success/20 dark:border-success/30">
                      ENFORCING
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Triggers immediate rollback if 5xx error rate spikes above 0.5% in 3 mins.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-card-border">
                <div className="w-6 h-6 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Secret & Credential Sanitizer</p>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 dark:bg-success/20 dark:border-success/30">
                      ENFORCING
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Scans commit diffs for exposed JWTs, AWS credentials, and SSH keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-card-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Quarantine status: <strong className="text-success">No active blocks</strong></span>
            <span className="text-muted-foreground">All 5 policies passing</span>
          </div>
        </div>
      </div>
    </div>
  );
}