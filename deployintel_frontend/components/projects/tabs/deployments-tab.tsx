"use client";

import React, { useState } from "react";
import type { Project } from "@/lib/api/project";
import { 
  GitCommit, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

interface DeploymentsTabProps {
  project: Project;
  onSelectDeployment?: (depId: string) => void;
}

interface DeploymentItem {
  id: string;
  version: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  authorAvatar?: string;
  branch: string;
  environment: "Production" | "Staging" | "Preview";
  riskScore: number;
  gateDecision: "ALLOWED" | "BLOCKED" | "REVIEW";
  duration: string;
  timeAgo: string;
}

const mockDeployments: DeploymentItem[] = [
  {
    id: "dep-101",
    version: "v2.4.1",
    commitHash: "e4b281f",
    commitMessage: "refactor(core): optimize query caching and connection pool",
    author: "Alex Morgan",
    branch: "main",
    environment: "Production",
    riskScore: 18,
    gateDecision: "ALLOWED",
    duration: "1m 42s",
    timeAgo: "8m ago",
  },
  {
    id: "dep-102",
    version: "v2.4.0",
    commitHash: "77fa9c0",
    commitMessage: "feat(auth): integrate bi-directional session revocation",
    author: "Sarah Chen",
    branch: "main",
    environment: "Production",
    riskScore: 24,
    gateDecision: "ALLOWED",
    duration: "2m 10s",
    timeAgo: "2h ago",
  },
  {
    id: "dep-103",
    version: "v2.5.0-rc1",
    commitHash: "c018a3d",
    commitMessage: "perf(worker): parallelize invoice batch processing",
    author: "David Kim",
    branch: "staging",
    environment: "Staging",
    riskScore: 78,
    gateDecision: "BLOCKED",
    duration: "45s",
    timeAgo: "5h ago",
  },
  {
    id: "dep-104",
    version: "v2.3.9",
    commitHash: "3a19b88",
    commitMessage: "fix(webhook): handle timeout retry backoff gracefully",
    author: "Alex Morgan",
    branch: "main",
    environment: "Production",
    riskScore: 12,
    gateDecision: "ALLOWED",
    duration: "1m 15s",
    timeAgo: "1d ago",
  },
  {
    id: "dep-105",
    version: "v2.3.8",
    commitHash: "90df4a2",
    commitMessage: "chore(deps): bump tailwindcss and prisma client",
    author: "Bot Dependabot",
    branch: "main",
    environment: "Production",
    riskScore: 52,
    gateDecision: "REVIEW",
    duration: "1m 58s",
    timeAgo: "2d ago",
  },
];

export function DeploymentsTab({ project }: DeploymentsTabProps) {
  const [filterEnv, setFilterEnv] = useState<string>("All");
  const [filterDecision, setFilterDecision] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedDep, setSelectedDep] = useState<DeploymentItem | null>(null);

  const filteredDeployments = mockDeployments.filter((dep) => {
    const matchesEnv = filterEnv === "All" || dep.environment === filterEnv;
    const matchesDecision = filterDecision === "All" || dep.gateDecision === filterDecision;
    const matchesSearch =
      dep.commitMessage.toLowerCase().includes(search.toLowerCase()) ||
      dep.commitHash.toLowerCase().includes(search.toLowerCase()) ||
      dep.version.toLowerCase().includes(search.toLowerCase()) ||
      dep.author.toLowerCase().includes(search.toLowerCase());
    return matchesEnv && matchesDecision && matchesSearch;
  });

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "ALLOWED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ALLOWED
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            BLOCKED
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            REVIEW
          </span>
        );
      default:
        return null;
    }
  };

  const getEnvBadge = (env: string) => {
    switch (env) {
      case "Production":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Staging":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
      {/* Top filter toolbar */}
      <div className="p-5 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Environment Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl">
          {["All", "Production", "Staging"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterEnv(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterEnv === tab
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Decision Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by commit or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/10 transition-all placeholder:text-zinc-400"
            />
          </div>

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="h-8.5 px-3 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl outline-none focus:border-[#5850ec] transition-all"
          >
            <option value="All">All Verdicts</option>
            <option value="ALLOWED">Allowed Only</option>
            <option value="BLOCKED">Blocked Only</option>
            <option value="REVIEW">Review Only</option>
          </select>
        </div>
      </div>

      {/* Deployments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="py-3.5 px-5">Release / Commit</th>
              <th className="py-3.5 px-4">Environment</th>
              <th className="py-3.5 px-4">Gate Decision</th>
              <th className="py-3.5 px-4">AI Risk Score</th>
              <th className="py-3.5 px-4">Author</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4 text-right">Time</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {filteredDeployments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-400">
                  No deployments matching current criteria.
                </td>
              </tr>
            ) : (
              filteredDeployments.map((dep) => (
                <tr
                  key={dep.id}
                  className="hover:bg-zinc-50/70 transition-colors group cursor-pointer"
                  onClick={() => setSelectedDep(dep)}
                >
                  {/* Release / Commit */}
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 mt-0.5 font-mono text-[11px] font-bold">
                        <GitCommit className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">{dep.version}</span>
                          <span className="font-mono text-[11px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                            {dep.commitHash}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 font-medium max-w-md truncate mt-0.5">
                          {dep.commitMessage}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Environment */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getEnvBadge(dep.environment)}`}>
                      {dep.environment}
                    </span>
                  </td>

                  {/* Gate Decision */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getDecisionBadge(dep.gateDecision)}
                  </td>

                  {/* AI Risk Score */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${
                        dep.riskScore <= 30 ? "text-emerald-600" : dep.riskScore <= 65 ? "text-amber-600" : "text-rose-600"
                      }`}>
                        {dep.riskScore}
                      </span>
                      <div className="w-16 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dep.riskScore <= 30 ? "bg-emerald-500" : dep.riskScore <= 65 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${dep.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-zinc-700 font-medium">{dep.author}</span>
                  </td>

                  {/* Duration */}
                  <td className="py-4 px-4 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                    {dep.duration}
                  </td>

                  {/* Time */}
                  <td className="py-4 px-4 text-right whitespace-nowrap text-zinc-400">
                    {dep.timeAgo}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDep(dep);
                      }}
                      className="text-xs font-semibold text-[#5850ec] hover:text-[#4d44e7] p-1.5 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-1"
                    >
                      Audit
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Deployment Audit Drawer / Modal preview */}
      {selectedDep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-500">{selectedDep.commitHash}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs font-bold text-zinc-900">{selectedDep.version}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-1">{selectedDep.commitMessage}</h3>
              </div>
              <button
                onClick={() => setSelectedDep(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium">Gate Decision</p>
                <div className="mt-1">{getDecisionBadge(selectedDep.gateDecision)}</div>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium">Risk Score</p>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">{selectedDep.riskScore} / 100</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">AI Model Verdict Summary</p>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 space-y-1.5 leading-relaxed">
                {selectedDep.riskScore > 65 ? (
                  <p className="text-rose-700 font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    Deployment blocked due to high blast radius across database transactions.
                  </p>
                ) : (
                  <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    All guardrails satisfied. Zero critical dependencies or secret leaks identified.
                  </p>
                )}
                <p className="text-zinc-500">
                  Author: <span className="text-zinc-800 font-semibold">{selectedDep.author}</span> • Branch: <span className="font-mono text-zinc-800">{selectedDep.branch}</span> • Verified in {selectedDep.duration}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setSelectedDep(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
