import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/stat-card";
import { RequiresAttentionPanel } from "@/components/dashboard/requires-attention-panel";
import { PipelineVerificationFlow } from "@/components/dashboard/pipeline-verification-flow";
import { RecentDeploymentsTable } from "@/components/dashboard/recent-deployments-table";
import { RiskTrajectoryChart } from "@/components/dashboard/risk-trajectory-chart";
import { ZeroStatePreview } from "@/components/dashboard/zero-state-preview";

export const metadata: Metadata = {
  title: "Dashboard - DeployIntel",
  description: "Monitor deployment risk, gate verdicts, and telemetry across all your pipelines.",
};

export default function DashboardPage() {
  return (
    <div className="px-6 py-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {/* Firewall status */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">
              Firewall Sentinel Online
            </span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 leading-tight">Good afternoon, Alex</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Here&apos;s what&apos;s happening across your deployment gates and telemetry feeds.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 rounded-lg transition-colors shadow-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-400">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export Audit Log
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-3 py-2 rounded-lg transition-colors shadow-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5h-6.5a.75.75 0 010-1.5h6.5v-6.5A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
            New Deployment
            <kbd className="ml-0.5 text-[9px] font-bold text-white/60 bg-white/10 px-1 py-0.5 rounded">N</kbd>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Managed Projects"
          value="12"
          subtitle="3 active pipelines"
          trend={{ value: "+2", direction: "up", color: "blue" }}
        />
        <StatCard
          label="30-Day Deployments"
          value="48"
          subtitle="Last deploy 8m ago"
          trend={{ value: "+14", direction: "up", color: "blue" }}
        />
        <StatCard
          label="Blocked Gates"
          value="7"
          subtitle="Firewall auto-tripped"
          badge={{ label: "2 need review", color: "red" }}
          statusDot={{ color: "red", label: "Quarantine active" }}
        />
        <StatCard
          label="Fleet Avg Risk"
          value="34"
          subtitle="Threshold limit: 65 · Safe zone"
          trend={{ value: "8%", direction: "down", color: "green" }}
        />
      </div>

      {/* Requires Attention */}
      <RequiresAttentionPanel />

      {/* Pipeline Verification Flow */}
      <PipelineVerificationFlow />

      {/* Recent Deployments Table */}
      <RecentDeploymentsTable />

      {/* Bottom row: chart + zero state */}
      <div className="grid grid-cols-[1fr_320px] gap-4 mb-6">
        <RiskTrajectoryChart />
        <ZeroStatePreview />
      </div>
    </div>
  );
}
