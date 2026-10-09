"use client";

import React from "react";
import { ShieldCheck, Zap, Activity, AlertOctagon, TrendingDown, ArrowUpRight } from "lucide-react";

interface ProjectKpisProps {
  riskScore?: number;
  approvalRate?: string;
  mttv?: string;
  activePolicies?: number;
}

export function ProjectKpis({
  riskScore = 18,
  approvalRate = "97.4%",
  mttv = "1.8s",
  activePolicies = 5,
}: ProjectKpisProps) {
  const getRiskStatus = (score: number) => {
    if (score <= 30) return { label: "LOW RISK (SAFE)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score <= 65) return { label: "MEDIUM RISK", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "HIGH RISK (BLOCKED)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const riskStatus = getRiskStatus(riskScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Risk Score */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">AI Risk Score</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">{riskScore}</span>
              <span className="text-xs font-semibold text-zinc-400">/ 100</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskStatus.color}`}>
            {riskStatus.label}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="mt-4">
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskScore <= 30 ? "bg-emerald-500" : riskScore <= 65 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <TrendingDown className="w-3 h-3" /> -4 pts vs last commit
            </span>
            <span>Threshold: 65</span>
          </div>
        </div>
      </div>

      {/* 2. Gate Approval Rate */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Gate Approval Rate</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">{approvalRate}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 font-medium">38 Allowed</span>
          <span className="text-zinc-300">•</span>
          <span className="text-rose-600 font-medium">1 Blocked</span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-400">Last 30 days</span>
        </div>
      </div>

      {/* 3. Mean Time to Verdict */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Mean Time to Verdict</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">{mttv}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
          <span className="text-emerald-600 font-medium flex items-center gap-0.5">
            <Zap className="w-3 h-3" /> Real-time AST eval
          </span>
          <span className="text-zinc-400">P99: 3.1s</span>
        </div>
      </div>

      {/* 4. Active Policies */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Active Guardrails</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">{activePolicies}</span>
              <span className="text-xs font-semibold text-zinc-400">enforcing</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            100% Policy Health
          </span>
          <span className="text-[#5850ec] font-semibold hover:underline cursor-pointer flex items-center">
            View <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
