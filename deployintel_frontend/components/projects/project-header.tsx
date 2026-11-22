"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Project, ProjectRole } from "@/lib/api/project";
import {
  GitBranch,
  ExternalLink,
  Settings,
  Play,
  Check,
  Copy,
  Activity,
  Sparkles,
  Crown,
  Wrench,
  Code2,
  Eye
} from "lucide-react";

const ROLE_BADGE: Record<ProjectRole, { label: string; className: string; icon: React.ReactNode }> = {
  OWNER:      { label: "Owner",      className: "bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/30", icon: <Crown className="w-3 h-3" /> },
  MAINTAINER: { label: "Maintainer", className: "bg-info/10 dark:bg-info/20 text-info dark:text-info border-info/20 dark:border-info/30",       icon: <Wrench className="w-3 h-3" /> },
  DEVELOPER:  { label: "Developer",  className: "bg-success/10 dark:bg-success/20 text-success dark:text-success border-success/20 dark:border-success/30", icon: <Code2 className="w-3 h-3" /> },
  VIEWER:     { label: "Viewer",     className: "bg-muted text-muted-foreground border-card-border",       icon: <Eye className="w-3 h-3" /> },
};

interface ProjectHeaderProps {
  project: Project;
  onRunAnalysis: () => void;
  onTriggerGateCheck?: () => void;
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

export function ProjectHeader({ project, onRunAnalysis, onTriggerGateCheck }: ProjectHeaderProps) {
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
    <div className="bg-card border-b border-card-border -mx-6 -mt-8 px-8 pt-8 pb-6 mb-8 shadow-xs">
      {/* Top breadcrumb & Status badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <span>Projects</span>
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-semibold">{project.name}</span>

          <span className="mx-1 text-muted-foreground/50">•</span>

          {isArchived ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-card-border">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Archived
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/20 dark:bg-success/20 dark:border-success/30 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Sentinel Gate Active
            </span>
          )}
        </div>

        {/* Quick project ID badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyProjectId}
            title="Click to copy Project ID"
            className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-card-border px-2.5 py-1 rounded-lg transition-all"
          >
            <span className="text-muted-foreground/50">ID:</span>
            <span>{project.id.length > 12 ? `${project.id.slice(0, 10)}...` : project.id}</span>
            {copiedId ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Main Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 dark:bg-accent/20 dark:border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                {project.name}
              </h1>
              <p className="text-xs text-muted-foreground max-w-2xl line-clamp-1 mt-0.5">
                {project.description || "Continuous deployment risk scoring, automated guardrails, and gate analytics."}
              </p>
            </div>
          </div>

          {/* Metadata tags */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            {/* Repo link */}
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-ring bg-muted hover:bg-ring/10 border border-card-border hover:border-ring/50 px-2.5 py-1 rounded-lg transition-colors font-medium text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-foreground">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{shortRepo}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>

            {/* Branch */}
            <span className="inline-flex items-center gap-1.5 bg-muted border border-card-border px-2.5 py-1 rounded-lg text-foreground font-mono text-[11px]">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
              {project.defaultBranch || "main"}
            </span>

            {/* Language */}
            {project.language && (
              <span className="inline-flex items-center gap-1.5 bg-muted border border-card-border px-2.5 py-1 rounded-lg text-foreground font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
                {project.language}
              </span>
            )}

            {/* Project role badge */}
            {project.currentUserRole && ROLE_BADGE[project.currentUserRole] && (
              <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[11px] font-semibold ${ROLE_BADGE[project.currentUserRole].className}`}>
                {ROLE_BADGE[project.currentUserRole].icon}
                {ROLE_BADGE[project.currentUserRole].label}
              </span>
            )}

            {/* Last verified time */}
            <span className="text-muted-foreground text-xs hidden sm:inline">
              Last gate evaluation: <span className="text-foreground font-medium">3 mins ago</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <Link
            href={`/projects/${project.id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-card hover:bg-muted border border-card-border px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Settings</span>
          </Link>

          <button
            onClick={onRunAnalysis}
            className="inline-flex items-center gap-2 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/15 border border-accent/20 dark:bg-accent/20 dark:border-accent/30 px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Simulate AI Gate</span>
          </button>

          <button
            onClick={onTriggerGateCheck || onRunAnalysis}
            className="inline-flex items-center gap-2 text-xs font-semibold text-accent-foreground bg-accent hover:bg-accent-hover px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-accent/20 active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Gate Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}