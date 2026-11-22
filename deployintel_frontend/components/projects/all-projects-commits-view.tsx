"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/api/project";
import { useProjectCommits } from "@/hooks/use-project-commits";
import { 
  GitCommit, 
  GitBranch, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowUpRight, 
  Search,
  ExternalLink
} from "lucide-react";

interface AllProjectsCommitsViewProps {
  projects: Project[];
}

export function AllProjectsCommitsView({ projects }: AllProjectsCommitsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredProjects = selectedProjectId === "all"
    ? projects
    : projects.filter((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card text-foreground p-4 rounded-2xl border border-card-border shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setSelectedProjectId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedProjectId === "all"
                ? "bg-[#5850ec] text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Projects ({projects.length})
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedProjectId === p.id
                  ? "bg-[#5850ec] text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search commits across projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-muted/40 border-card-border text-foreground placeholder:text-muted-foreground rounded-xl outline-none focus:border-[#5850ec] transition-all"
          />
        </div>
      </div>

      {/* Projects Commit Sections */}
      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <ProjectCommitSection
            key={project.id}
            project={project}
            searchQuery={search}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCommitSection({
  project,
  searchQuery,
}: {
  project: Project;
  searchQuery: string;
}) {
  const { data: commits, isLoading } = useProjectCommits(
    project.name,
    project.repositoryUrl,
    project.defaultBranch
  );

  const filtered = (commits || []).filter((c) => {
    if (!searchQuery) return true;
    return (
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="bg-card text-foreground rounded-2xl border border-card-border shadow-xs overflow-hidden">
      {/* Project Header in Commit Stream */}
      <div className="px-5 py-4 border-b border-card-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-[#5850ec] border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
            {project.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/projects/${project.id}`}
                className="text-xs font-bold text-foreground hover:text-[#5850ec] transition-colors"
              >
                {project.name}
              </Link>
              <span className="font-mono text-[11px] text-zinc-400 bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-zinc-400" />
                {project.defaultBranch || "main"}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}?tab=commits`}
          className="text-xs font-semibold text-[#5850ec] hover:underline flex items-center gap-1"
        >
          <span>Full Commit Log ({commits?.length || 0})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Commits List for this project */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-zinc-400">Loading commits…</div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center text-xs text-zinc-400">No matching commits found.</div>
      ) : (
        <div className="divide-y divide-card-border">
          {filtered.slice(0, 4).map((commit) => (
            <div
              key={commit.id}
              className="px-5 py-3.5 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="font-mono text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 text-muted-foreground rounded shrink-0 mt-0.5">
                  {commit.shortHash}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {commit.message}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span className="text-zinc-600 font-medium">{commit.authorName}</span>
                    <span>•</span>
                    <span>{commit.timeAgo}</span>
                    {commit.filesChanged && (
                      <>
                        <span>•</span>
                        <span>{commit.filesChanged} files</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Gate verdict & Risk */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-[11px] font-mono text-zinc-400">
                  Risk: <strong className={commit.riskScore > 65 ? "text-rose-600" : "text-emerald-600"}>{commit.riskScore}</strong>
                </span>

                {commit.gateVerdict === "ALLOWED" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ALLOWED
                  </span>
                ) : commit.gateVerdict === "BLOCKED" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    BLOCKED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    REVIEW
                  </span>
                )}

                <Link
                  href={`/projects/${project.id}?tab=commits`}
                  className="text-xs font-semibold text-[#5850ec] hover:underline"
                >
                  Audit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
