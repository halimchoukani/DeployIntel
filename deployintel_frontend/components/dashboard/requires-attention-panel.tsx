"use client";

import React from "react";

interface Alert {
  id: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  riskScore: number;
  commitHash: string;
  service: string;
  serviceSlug: string;
  title: string;
  description: string;
  timeAgo: string;
  status: string;
  primaryAction: string;
  secondaryAction: string;
  gateStatus: string;
}

const alerts: Alert[] = [
  {
    id: "1",
    riskLevel: "HIGH",
    riskScore: 76,
    commitHash: "84819",
    service: "MediFlow v1.1.2",
    serviceSlug: "acme/mediflow-service",
    title: "MediFlow v1.1.2",
    description:
      "4 integration tests failed. 1 high-severity dependency vulnerability (CVE-2024-1819) detected in auth worker container manifest.",
    timeAgo: "2m ago",
    status: "Gate Blocked",
    primaryAction: "Review analysis →",
    secondaryAction: "Emergency Override",
    gateStatus: "Gate Blocked",
  },
  {
    id: "2",
    riskLevel: "MEDIUM",
    riskScore: 54,
    commitHash: "84818",
    service: "Analytics API v3.0.0",
    serviceSlug: "acme/analytics-core",
    title: "Analytics API v3.0.0",
    description:
      "Performance regression detected: p99 latency spiked +142ms in staging load testing against synthetic cluster endpoints.",
    timeAgo: "14m ago",
    status: "Staging Hold",
    primaryAction: "Review telemetry →",
    secondaryAction: "Snooze Alert",
    gateStatus: "Staging Hold",
  },
];

const riskColors: Record<string, { badge: string; border: string; bg: string; dot: string }> = {
  HIGH: {
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-red-200",
    bg: "bg-red-50/30",
    dot: "bg-red-500",
  },
  MEDIUM: {
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    border: "border-violet-200",
    bg: "bg-violet-50/20",
    dot: "bg-violet-500",
  },
};

export function RequiresAttentionPanel() {
  return (
    <section className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <h2 className="text-sm font-semibold text-zinc-800">Requires Attention</h2>
          <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
            2 critical violations
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">Auto-quarantine policy applied</span>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 gap-4">
        {alerts.map((alert) => {
          const colors = riskColors[alert.riskLevel];
          return (
            <div
              key={alert.id}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                    <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                    {alert.riskLevel} RISK · {alert.riskScore}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">△ {alert.commitHash}</span>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">{alert.timeAgo}</span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{alert.title}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">{alert.serviceSlug}</p>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-600 leading-relaxed">
                {alert.description.includes("CVE") ? (
                  <>
                    4 integration tests failed. 1 high-severity dependency vulnerability (
                    <span className="text-red-600 font-medium underline cursor-pointer">CVE-2024-1819</span>
                    ) detected in auth worker container manifest.
                  </>
                ) : (
                  alert.description
                )}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button className="flex items-center gap-1 text-xs font-semibold text-[#5850ec] bg-[#5850ec]/10 hover:bg-[#5850ec]/15 px-3 py-1.5 rounded-lg transition-colors">
                  {alert.primaryAction}
                </button>
                <button className="text-xs font-medium text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors">
                  {alert.secondaryAction}
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] text-zinc-400">{alert.gateStatus}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
