"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/api/project";
import { 
  GitBranch, 
  ExternalLink, 
  Settings, 
  Play, 
  ShieldCheck, 
  Check, 
  Copy, 
  Plus, 
  Activity, 
  Sparkles,
  AlertTriangle
} from "lucide-react";

interface ProjectHeaderProps {
  project: Project;
  onRunAnalysis: () => void;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C#": "#178600",
  "C++": "#f34b7d",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

export function ProjectHeader({ project, onRunAnalysis }: ProjectHeaderProps) {
  const [copiedId, setCopiedId] = useState(false);

  function copyProjectId() {
    navigator.clipboard.writeText(project.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  const shortRepo = project.repositoryUrl
    ? project.repositoryUrl.replace(/^https?:\/\/github\.com\//, "")
    : "github.com/repository";

  const langColor = (project.language && LANG_COLORS[project.language]) || "#94a3b8";
  const isArchived = project.status === "ARCHIVED";

  return (
    <div className="bg-white border-b border-zinc-200 -mx-6 -mt-8 px-8 pt-8 pb-6 mb-8 shadow-xs">
      {/* Top breadcrumb & Status badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <Link href="/projects" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5">
            <span>Projects</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-semibold">{project.name}</span>

          <span className="mx-1 text-zinc-300">•</span>

          {isArchived ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Archived
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sentinel Gate Active
            </span>
          )}
        </div>

        {/* Quick project ID badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyProjectId}
            title="Click to copy Project ID"
            className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg transition-all"
          >
            <span className="text-zinc-400">ID:</span>
            <span>{project.id.length > 12 ? `${project.id.slice(0, 10)}...` : project.id}</span>
            {copiedId ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5850ec]/15 to-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850ec] shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
                {project.name}
              </h1>
              <p className="text-xs text-zinc-500 max-w-2xl line-clamp-1 mt-0.5">
                {project.description || "Continuous deployment risk scoring, automated guardrails, and gate analytics."}
              </p>
            </div>
          </div>

          {/* Metadata tags */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-500">
            {/* Repo link */}
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#5850ec] bg-zinc-50 hover:bg-indigo-50/50 border border-zinc-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg transition-colors font-medium text-zinc-700"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-zinc-700">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{shortRepo}</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            {/* Branch */}
            <span className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg text-zinc-700 font-mono text-[11px]">
              <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
              {project.defaultBranch || "main"}
            </span>

            {/* Language */}
            {project.language && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg text-zinc-700 font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
                {project.language}
              </span>
            )}

            {/* Last verified time */}
            <span className="text-zinc-400 text-xs hidden sm:inline">
              Last gate evaluation: <span className="text-zinc-600 font-medium">3 mins ago</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 rounded-xl transition-all shadow-xs hover:border-zinc-300"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span>Settings</span>
          </Link>

          <button
            onClick={onRunAnalysis}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5850ec]" />
            <span>Simulate AI Gate</span>
          </button>

          <button
            onClick={onRunAnalysis}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Gate Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}
