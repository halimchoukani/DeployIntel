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
  LOW: "bg-success/10 text-success border border-success/20 dark:bg-success/20 dark:border-success/30",
  MEDIUM: "bg-warning/10 text-warning border border-warning/20 dark:bg-warning/20 dark:border-warning/30",
  HIGH: "bg-destructive/10 text-destructive border border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30",
};

const decisionBadge: Record<string, { dot: string; text: string }> = {
  ALLOWED: { dot: "bg-success", text: "text-success" },
  BLOCKED: { dot: "bg-destructive", text: "text-destructive" },
  REVIEW: { dot: "bg-warning", text: "text-warning" },
};

const envBadge: Record<string, string> = {
  Production: "bg-accent/10 text-accent border border-accent/20 dark:bg-accent/20 dark:border-accent/30",
  Staging: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30",
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
    <section className="mb-6 bg-card rounded-xl border border-card-border overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-card-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Deployments</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Automated verdicts, risk levels, and delivery status across cluster nodes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 border border-card-border">
            {(["All", "Production", "Staging", "Blocked"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {tab === "Blocked" && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-destructive inline-block align-middle" />
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Filter releases..."
              className="h-7 pl-6 pr-3 rounded-lg border border-input-border bg-input-bg text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 transition-all w-36"
            />
          </div>

          <button className="text-[11px] font-medium text-accent hover:underline flex items-center gap-0.5">
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
            <tr className="border-b border-card-border bg-muted/40">
              {["PROJECT & REPOSITORY", "VERSION & COMMIT", "ENVIRONMENT", "RISK SCORE", "GATE DECISION", "TIME", "ACTIONS"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {filtered.map((dep) => {
              const decision = decisionBadge[dep.gateDecision];
              return (
                <tr key={dep.id} className="hover:bg-muted/40 transition-colors group">
                  {/* Project */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dep.riskLevel === "HIGH" ? "bg-destructive" : dep.riskLevel === "MEDIUM" ? "bg-warning" : "bg-success"}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{dep.project}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{dep.repo}</p>
                      </div>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-5 py-3.5">
                    <p className={`text-xs font-mono font-semibold ${dep.riskLevel === "HIGH" ? "text-destructive" : "text-foreground"}`}>
                      {dep.version}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{dep.commit}</p>
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
                    <span className="text-[11px] text-muted-foreground">{dep.timeAgo}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted">
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