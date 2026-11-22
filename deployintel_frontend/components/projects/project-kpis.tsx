"use client";

import React from "react";
import { ShieldCheck, Zap, Activity, TrendingDown, ArrowUpRight } from "lucide-react";

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
    if (score <= 30) return { label: "LOW RISK (SAFE)", color: "text-success bg-success/10 border border-success/20 dark:bg-success/20 dark:border-success/30" };
    if (score <= 65) return { label: "MEDIUM RISK", color: "text-warning bg-warning/10 border border-warning/20 dark:bg-warning/20 dark:border-warning/30" };
    return { label: "HIGH RISK (BLOCKED)", color: "text-destructive bg-destructive/10 border border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30" };
  };

  const riskStatus = getRiskStatus(riskScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Risk Score */}
      <div className="bg-card rounded-2xl border border-card-border p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">AI Risk Score</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">{riskScore}</span>
              <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskStatus.color}`}>
            {riskStatus.label}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="mt-4">
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden flex border border-card-border">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskScore <= 30 ? "bg-success" : riskScore <= 65 ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-success font-medium">
              <TrendingDown className="w-3 h-3" /> -4 pts vs last commit
            </span>
            <span>Threshold: 65</span>
          </div>
        </div>
      </div>

      {/* 2. Gate Approval Rate */}
      <div className="bg-card rounded-2xl border border-card-border p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gate Approval Rate</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">{approvalRate}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-success/10 text-success border border-success/20 dark:bg-success/20 dark:border-success/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-card-border flex items-center justify-between text-[11px]">
          <span className="text-foreground font-medium">38 Allowed</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-destructive font-medium">1 Blocked</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-muted-foreground">Last 30 days</span>
        </div>
      </div>

      {/* 3. Mean Time to Verdict */}
      <div className="bg-card rounded-2xl border border-card-border p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mean Time to Verdict</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">{mttv}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent border border-accent/20 dark:bg-accent/20 dark:border-accent/30 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-card-border flex items-center justify-between text-[11px]">
          <span className="text-success font-medium flex items-center gap-0.5">
            <Zap className="w-3 h-3" /> Real-time AST eval
          </span>
          <span className="text-muted-foreground">P99: 3.1s</span>
        </div>
      </div>

      {/* 4. Active Policies */}
      <div className="bg-card rounded-2xl border border-card-border p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Guardrails</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">{activePolicies}</span>
              <span className="text-xs font-semibold text-muted-foreground">enforcing</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 dark:border-violet-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-card-border flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            100% Policy Health
          </span>
          <span className="text-accent font-semibold hover:underline cursor-pointer flex items-center">
            View <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}