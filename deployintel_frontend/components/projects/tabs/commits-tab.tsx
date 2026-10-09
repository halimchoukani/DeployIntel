"use client";

import React, { useState } from "react";
import type { Project } from "@/lib/api/project";
import { useProjectCommits } from "@/hooks/use-project-commits";
import type { ProjectCommit } from "@/lib/api/commits";
import { 
  GitCommit, 
  GitBranch, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  FileCode, 
  Filter,
  Play
} from "lucide-react";

interface CommitsTabProps {
  project: Project;
  onRunAnalysis?: () => void;
}

export function CommitsTab({ project, onRunAnalysis }: CommitsTabProps) {
  const { data: commits, isLoading } = useProjectCommits(
    project.name,
    project.repositoryUrl,
    project.defaultBranch
  );

  const [search, setSearch] = useState("");
  const [filterVerdict, setFilterVerdict] = useState<string>("All");
  const [selectedCommit, setSelectedCommit] = useState<ProjectCommit | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredCommits = (commits || []).filter((c) => {
    const matchesSearch =
      c.message.toLowerCase().includes(search.toLowerCase()) ||
      c.shortHash.toLowerCase().includes(search.toLowerCase()) ||
      c.authorName.toLowerCase().includes(search.toLowerCase());
    const matchesVerdict =
      filterVerdict === "All" || c.gateVerdict === filterVerdict;
    return matchesSearch && matchesVerdict;
  });

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
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

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200/80 text-xs font-semibold text-zinc-700">
            <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
            <span>Branch:</span>
            <span className="font-mono text-zinc-900">{project.defaultBranch || "main"}</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {commits ? `${commits.length} commits recorded` : "Loading commits..."}
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search commits or authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/10 transition-all placeholder:text-zinc-400"
            />
          </div>

          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="h-8.5 px-3 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl outline-none focus:border-[#5850ec] transition-all"
          >
            <option value="All">All Gate Verdicts</option>
            <option value="ALLOWED">Allowed Only</option>
            <option value="BLOCKED">Blocked Only</option>
            <option value="REVIEW">Review Only</option>
          </select>
        </div>
      </div>

      {/* 2. Commits List */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-7 h-7 border-3 border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Syncing git commit log with gate verifier…</p>
          </div>
        ) : filteredCommits.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 text-xs">
            No commits matching current criteria.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredCommits.map((commit, idx) => (
              <div
                key={commit.id || idx}
                onClick={() => setSelectedCommit(commit)}
                className="p-4.5 hover:bg-zinc-50/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left: Commit info & message */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Author Avatar or Initial */}
                  {commit.authorAvatar ? (
                    <img
                      src={commit.authorAvatar}
                      alt={commit.authorName}
                      className="w-8 h-8 rounded-full border border-zinc-200 object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {commit.authorName.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900 group-hover:text-[#5850ec] transition-colors line-clamp-1">
                        {commit.message}
                      </span>
                      {/* Short hash copy button */}
                      <button
                        onClick={(e) => copyHash(commit.hash, e)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded-md transition-colors"
                        title="Click to copy full commit hash"
                      >
                        <GitCommit className="w-3 h-3 text-zinc-400" />
                        <span>{commit.shortHash}</span>
                        {copiedHash === commit.hash ? (
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-zinc-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                      <span className="font-medium text-zinc-700">{commit.authorName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {commit.timeAgo}
                      </span>
                      {commit.filesChanged && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-zinc-500">
                            {commit.filesChanged} files modified
                          </span>
                        </>
                      )}
                      {commit.additions !== undefined && (
                        <span className="font-mono text-emerald-600 font-medium">
                          +{commit.additions}
                        </span>
                      )}
                      {commit.deletions !== undefined && (
                        <span className="font-mono text-rose-600 font-medium">
                          -{commit.deletions}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Gate Decision & Risk Score */}
                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Risk Index
                    </p>
                    <p
                      className={`text-xs font-mono font-bold mt-0.5 ${
                        commit.riskScore <= 30
                          ? "text-emerald-600"
                          : commit.riskScore <= 65
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {commit.riskScore} / 100
                    </p>
                  </div>

                  <div>{getVerdictBadge(commit.gateVerdict)}</div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCommit(commit);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-[#5850ec] hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Commit Audit Inspection Modal */}
      {selectedCommit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                    {selectedCommit.shortHash}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs text-zinc-500 font-medium">{selectedCommit.branch}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-1.5 leading-snug">
                  {selectedCommit.message}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCommit(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {/* Verdict summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Gate Evaluation
                </span>
                <div className="mt-1.5">{getVerdictBadge(selectedCommit.gateVerdict)}</div>
              </div>
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  ML Risk Score
                </span>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">
                  {selectedCommit.riskScore} <span className="text-xs font-normal text-zinc-400">/ 100</span>
                </p>
              </div>
            </div>

            {/* Analysis details */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5850ec]" />
                  AI Policy Assessment
                </span>
                <span className="text-zinc-400 text-[11px]">{selectedCommit.timeAgo}</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                {selectedCommit.analysisSummary}
              </p>
              <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Committed by <strong className="text-zinc-800">{selectedCommit.authorName}</strong></span>
                <span>{selectedCommit.filesChanged || 4} files affected</span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-between items-center pt-2">
              <a
                href={`${project.repositoryUrl}/commit/${selectedCommit.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 hover:underline"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCommit(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Close
                </button>
                {onRunAnalysis && (
                  <button
                    onClick={() => {
                      setSelectedCommit(null);
                      onRunAnalysis();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Re-evaluate Gate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
