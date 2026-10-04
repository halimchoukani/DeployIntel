"use client";

import React, { useState } from "react";

type FilterTab = "All" | "Production" | "Staging" | "Blocked";

const deployments = [
  {
    id: "1",
    project: "Checkout Service",
    repo: "acme/checkout-engine",
    version: "v2.4.1",
    commit: "6f3b2e1",
    environment: "Production",
    riskScore: 24,
    riskLevel: "LOW",
    gateDecision: "ALLOWED",
    timeAgo: "8 min ago",
  },
  {
    id: "2",
    project: "MediFlow",
    repo: "acme/mediflow-service",
    version: "v1.1.2",
    commit: "e4a196b",
    environment: "Production",
    riskScore: 76,
    riskLevel: "HIGH",
    gateDecision: "BLOCKED",
    timeAgo: "32 min ago",
  },
  {
    id: "3",
    project: "Analytics API",
    repo: "acme/analytics-core",
    version: "v3.0.0",
    commit: "33c8e17",
    environment: "Staging",
    riskScore: 54,
    riskLevel: "MEDIUM",
    gateDecision: "REVIEW",
    timeAgo: "1 hour ago",
  },
  {
    id: "4",
    project: "Auth Broker",
    repo: "acme/auth-identity",
    version: "v1.3.9",
    commit: "4b77f29",
    environment: "Production",
    riskScore: 21,
    riskLevel: "LOW",
    gateDecision: "ALLOWED",
    timeAgo: "2 hours ago",
  },
];

const riskBadge: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200",
  HIGH: "bg-red-50 text-red-700 border border-red-200",
};

const decisionBadge: Record<string, { dot: string; text: string }> = {
  ALLOWED: { dot: "bg-emerald-400", text: "text-emerald-700" },
  BLOCKED: { dot: "bg-red-500", text: "text-red-700" },
  REVIEW: { dot: "bg-amber-400", text: "text-amber-700" },
};

const envBadge: Record<string, string> = {
  Production: "bg-violet-50 text-violet-700 border border-violet-200",
  Staging: "bg-blue-50 text-blue-700 border border-blue-200",
};

export function RecentDeploymentsTable() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const filtered =
    activeTab === "All"
      ? deployments
      : activeTab === "Blocked"
      ? deployments.filter((d) => d.gateDecision === "BLOCKED")
      : deployments.filter((d) => d.environment === activeTab);

  return (
    <section className="mb-6 bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Recent Deployments</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Automated verdicts, risk levels, and delivery status across cluster nodes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
            {(["All", "Production", "Staging", "Blocked"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                  activeTab === tab
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab}
                {tab === "Blocked" && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-red-500 inline-block align-middle" />
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Filter releases..."
              className="h-7 pl-6 pr-3 rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:border-[#5850ec] transition-all w-36"
            />
          </div>

          <button className="text-[11px] font-medium text-[#5850ec] hover:underline flex items-center gap-0.5">
            View all
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100">
              {["PROJECT & REPOSITORY", "VERSION & COMMIT", "ENVIRONMENT", "RISK SCORE", "GATE DECISION", "TIME", "ACTIONS"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.map((dep) => {
              const decision = decisionBadge[dep.gateDecision];
              return (
                <tr key={dep.id} className="hover:bg-zinc-50/50 transition-colors group">
                  {/* Project */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dep.riskLevel === "HIGH" ? "bg-red-500" : dep.riskLevel === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{dep.project}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{dep.repo}</p>
                      </div>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-5 py-3.5">
                    <p className={`text-xs font-mono font-semibold ${dep.riskLevel === "HIGH" ? "text-red-600" : "text-zinc-700"}`}>
                      {dep.version}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono">{dep.commit}</p>
                  </td>

                  {/* Environment */}
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${envBadge[dep.environment]}`}>
                      {dep.environment}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${riskBadge[dep.riskLevel]}`}>
                      • {dep.riskScore} {dep.riskLevel}
                    </span>
                  </td>

                  {/* Gate Decision */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${decision.dot}`} />
                      <span className={`text-[11px] font-bold ${decision.text}`}>{dep.gateDecision}</span>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] text-zinc-400">{dep.timeAgo}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <button className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded hover:bg-zinc-100">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
