"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { Project } from "@/lib/api/project";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncateWords(text: string | null | undefined, limit = 2): string {
  if (!text || !text.trim()) return "No description";
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text.trim();
  return `${words.slice(0, limit).join(" ")}...`;
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

function LangDot({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const color = LANG_COLORS[lang] ?? "#94a3b8";
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium text-zinc-500">{lang}</span>
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [patInput, setPatInput] = useState("");
  const [patError, setPatError] = useState("");
  const { data: projects, isLoading, error } = useProjects();
  const { data: authUser } = useAuthUser();
  const showGithubBanner = authUser && authUser.githubConnected === false;

  function handlePATSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = patInput.trim();
    if (!token) {
      setPatError("Please enter a GitHub Personal Access Token.");
      return;
    }
    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      setPatError("Token should start with ghp_ or github_pat_");
      return;
    }
    sessionStorage.setItem("github_pat_temp", token);
    router.push("/projects/new?tab=github");
  }

  const filteredProjects = projects?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto">
      {/* GitHub PAT Banner */}
      {showGithubBanner && (
        <div className="mb-6 bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#24292f] flex items-center justify-center shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900">Add a project from GitHub</p>
              <p className="text-xs text-zinc-500 mt-0.5 mb-3">
                Paste a GitHub{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=DeployIntel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5850ec] hover:underline"
                >
                  Personal Access Token
                </a>{" "}
                to browse and import your repositories.
              </p>
              <form onSubmit={handlePATSubmit} className="flex items-center gap-2">
                <input
                  id="pat-input"
                  type="password"
                  value={patInput}
                  onChange={(e) => { setPatInput(e.target.value); setPatError(""); }}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 h-9 px-3 text-sm text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/10 transition-all placeholder:text-zinc-400 font-mono"
                />
                <button
                  id="pat-browse-btn"
                  type="submit"
                  className="h-9 px-4 text-sm font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-lg transition-colors shadow-sm shrink-0"
                >
                  Browse Repos
                </button>
              </form>
              {patError && (
                <p className="text-xs text-red-500 mt-1.5">{patError}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-tight">Projects</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your monitored applications and their configurations.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5h-6.5a.75.75 0 010-1.5h6.5v-6.5A.75.75 0 0110 3z"
              clipRule="evenodd"
            />
          </svg>
          New Project
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-[320px]">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-xl outline-none focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/10 transition-all placeholder:text-zinc-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">
            {projects?.length || 0} projects
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-white border border-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-600">Failed to load projects</p>
          <p className="text-xs text-red-500 mt-1">{(error as Error).message}</p>
        </div>
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-200 rounded-3xl py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-zinc-400">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">No projects found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
            Get started by importing a repository from GitHub or manually configuring a new project.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  // Extract user/repo if from github
  const shortUrl = project.repositoryUrl.replace(/^https?:\/\/github\.com\//, "");

  return (
    <div className="group bg-white border border-zinc-200 hover:border-[#5850ec]/40 hover:shadow-md transition-all rounded-2xl p-5 flex flex-col relative overflow-hidden">
      {project.status === "ARCHIVED" && (
        <div className="absolute top-0 right-0 bg-zinc-100 text-zinc-500 text-[10px] font-bold px-2 py-1 rounded-bl-xl border-b border-l border-zinc-200">
          ARCHIVED
        </div>
      )}

      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-zinc-500">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-zinc-900 group-hover:text-[#5850ec] transition-colors line-clamp-1">
              {project.name}
            </h3>
            <p
              className="text-xs text-zinc-500 mt-0.5 w-full overflow-hidden overflow-ellipsis whitespace-nowrap"
              title={project.description || undefined}
            >
              {project.description || "No description"}
            </p>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}/edit`}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-[#5850ec] hover:bg-[#5850ec]/10 rounded-lg transition-all"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25-1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 mt-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-400 shrink-0">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{shortUrl}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <LangDot lang={project.language} />
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-zinc-400">
              <path d="M6 3v12" />
              <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M15 18a9 9 0 0 0-9-9" />
            </svg>
            {project.defaultBranch}
          </span>
        </div>
        <span className="text-[11px] font-medium text-zinc-400">
          Updated {timeAgo(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}
