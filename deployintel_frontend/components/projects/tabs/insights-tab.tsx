"use client";

import React from "react";
import type { Project } from "@/lib/api/project";
import { 
  Network, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  FileCode, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Activity, 
  Sparkles 
} from "lucide-react";

interface InsightsTabProps {
  project: Project;
}

export function InsightsTab({ project }: InsightsTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Blast Radius Architecture Map */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5850ec]" />
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Automated Blast Radius Topology
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Downstream services, data stores, and API contracts analyzed for latest deployment diff
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Low Blast Radius: 2 Services Impacted
          </span>
        </div>

        {/* Interactive Visual Graph nodes */}
        <div className="bg-gradient-to-b from-zinc-50/80 to-zinc-50/20 border border-zinc-200/80 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Origin Node */}
            <div className="w-52 bg-white rounded-xl border-2 border-indigo-500/40 p-4 shadow-sm text-center relative group">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#5850ec] text-white px-2 py-0.5 rounded-full">
                ORIGIN DIFF
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5850ec] flex items-center justify-center mx-auto mb-2 mt-1">
                <FileCode className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-zinc-900">{project.name}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">14 changed files</p>
            </div>

            {/* Connecting Arrow */}
            <div className="flex items-center justify-center text-zinc-400 rotate-90 md:rotate-0">
              <span className="text-xs font-bold font-mono px-2 py-1 bg-white border border-zinc-200 rounded-md shadow-2xs">
                gRPC / REST
              </span>
            </div>

            {/* Downstream Service 1 */}
            <div className="w-52 bg-white rounded-xl border border-zinc-200 p-4 shadow-xs text-center relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                SAFE
              </span>
              <div className="w-9 h-9 rounded-xl bg-zinc-50 text-zinc-700 flex items-center justify-center mx-auto mb-2 mt-1">
                <Layers className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-xs font-bold text-zinc-900">Auth & Token Service</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Contract Verified</p>
            </div>

            {/* Connecting Arrow */}
            <div className="flex items-center justify-center text-zinc-400 rotate-90 md:rotate-0">
              <span className="text-xs font-bold font-mono px-2 py-1 bg-white border border-zinc-200 rounded-md shadow-2xs">
                TCP / Pool
              </span>
            </div>

            {/* Database Node */}
            <div className="w-52 bg-white rounded-xl border border-zinc-200 p-4 shadow-xs text-center relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                ZERO DDL LOCK
              </span>
              <div className="w-9 h-9 rounded-xl bg-zinc-50 text-zinc-700 flex items-center justify-center mx-auto mb-2 mt-1">
                <Cpu className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-xs font-bold text-zinc-900">PostgreSQL Primary</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Read-replica healthy</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Anomaly Signals & High-Risk Code Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Signals */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">AI Anomaly & Drift Signals</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Pre-deployment signals correlated against 10,000+ past deployments</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Zero Critical Vulnerabilities (CVE)</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Package dependency tree scanned across npm and OS levels. No zero-day CVE matches.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Schema Backward-Compatibility</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    No column removals, rename mutations, or table locking DDL statements detected.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Test Execution Confidence: 99.4%</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    142 integration test suites executed with 0 flaky assertions or timeouts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
            <span>Model Inference: 240ms</span>
            <span className="text-emerald-600 font-semibold">Telemetry Verified</span>
          </div>
        </div>

        {/* High-Risk Hotspots */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Code Hotspot Churn</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Files with high cyclomatic complexity and modification frequency</p>
              </div>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs">
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-mono font-medium text-zinc-800">lib/services/checkout.ts</span>
                    <p className="text-[10px] text-zinc-400">+180 lines • Risk Weight 22%</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Safe
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs">
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-mono font-medium text-zinc-800">app/api/auth/token/route.ts</span>
                    <p className="text-[10px] text-zinc-400">+45 lines • Risk Weight 15%</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Safe
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs">
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-mono font-medium text-zinc-800">db/migrations/202610_indices.sql</span>
                    <p className="text-[10px] text-zinc-400">+12 lines • Risk Weight 8%</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Concurrent
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
            <span>AST Parse Depth: 12 levels</span>
            <span className="text-zinc-600 font-medium">All functions verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
