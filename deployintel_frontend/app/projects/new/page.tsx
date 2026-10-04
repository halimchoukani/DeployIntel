"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGithubRepos, useCreateProjectFromGithub, useCreateProject } from "@/hooks/use-projects";
import type { GithubRepo } from "@/lib/api/project";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Java: "#f89820",
  Go: "#00aed8",
  Rust: "#ce422b",
  "C#": "#9b4f96",
  "C++": "#f34b7d",
  Ruby: "#701516",
  PHP: "#4f5d95",
  Swift: "#ffac45",
  Kotlin: "#a97bff",
};

function LangDot({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const color = LANG_COLORS[lang] ?? "#94a3b8";
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-zinc-500">{lang}</span>
    </span>
  );
}

// ─── Types for the form ───────────────────────────────────────────────────────

type Mode = "github" | "manual";

interface ManualForm {
  name: string;
  description: string;
  repositoryUrl: string;
  defaultBranch: string;
  language: string;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("github");
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customBranch, setCustomBranch] = useState("");
  const [step, setStep] = useState<"pick" | "confirm">("pick");

  const [manualForm, setManualForm] = useState<ManualForm>({
    name: "",
    description: "",
    repositoryUrl: "",
    defaultBranch: "main",
    language: "",
  });

  const searchParams = useSearchParams();
  const [githubPat, setGithubPat] = useState<string | undefined>(undefined);

  // On mount: read PAT stored by projects page banner, switch to github tab if redirected
  useEffect(() => {
    const stored = sessionStorage.getItem("github_pat_temp");
    if (stored) setGithubPat(stored);
    if (searchParams.get("tab") === "github") setMode("github");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: repos, isLoading: reposLoading, error: reposError } = useGithubRepos(githubPat);
  const createFromGithub = useCreateProjectFromGithub();
  const createManual = useCreateProject();

  const filtered = useMemo(() => {
    if (!repos) return [];
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [repos, search]);

  function handleSelectRepo(repo: GithubRepo) {
    setSelectedRepo(repo);
    setCustomName(repo.name);
    setCustomDesc(repo.description ?? "");
    setCustomBranch(repo.defaultBranch);
    setStep("confirm");
  }

  async function handleGithubSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo) return;
    try {
      await createFromGithub.mutateAsync({
        repository: selectedRepo.fullName,
        name: customName || selectedRepo.name,
        description: customDesc || undefined,
        defaultBranch: customBranch || selectedRepo.defaultBranch,
        githubToken: githubPat,
      });
      // Clear the stored PAT after successful project creation
      sessionStorage.removeItem("github_pat_temp");
      router.push("/projects");
    } catch {
      // error shown via mutation state
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createManual.mutateAsync({
        name: manualForm.name,
        description: manualForm.description || undefined,
        repositoryUrl: manualForm.repositoryUrl,
        defaultBranch: manualForm.defaultBranch,
        language: manualForm.language || undefined,
      });
      router.push("/projects");
    } catch {
      // error shown via mutation state
    }
  }

  const isPending = createFromGithub.isPending || createManual.isPending;
  const mutError = createFromGithub.error || createManual.error;

  return (
    <div className="px-6 py-8 max-w-[860px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          id="new-project-back-btn"
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-tight">Create a new project</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Connect a GitHub repository to start monitoring deployments.
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl mb-8 w-fit">
        <button
          id="new-project-mode-github"
          onClick={() => { setMode("github"); setStep("pick"); setSelectedRepo(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "github"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          Import from GitHub
        </button>
        <button
          id="new-project-mode-manual"
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "manual"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
              clipRule="evenodd"
            />
          </svg>
          Enter manually
        </button>
      </div>

      {/* ── GITHUB MODE ───────────────────────────────────────── */}
      {mode === "github" && step === "pick" && (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              id="new-project-search"
              type="text"
              placeholder="Search your repositories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm text-zinc-900 placeholder-zinc-400 outline-none bg-transparent"
            />
          </div>

          {/* Repo list */}
          <div className="divide-y divide-zinc-50 max-h-[440px] overflow-y-auto">
            {reposLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
                <p className="text-sm text-zinc-400">Loading your GitHub repositories…</p>
              </div>
            ) : reposError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">Unable to load repositories</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {githubPat
                      ? "The token could not load repositories. Ensure it has the 'repo' scope and is still valid."
                      : "Make sure you signed in with GitHub and granted repository access."}
                  </p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm text-zinc-500">No repositories match your search.</p>
              </div>
            ) : (
              filtered.map((repo) => (
                <RepoRow key={repo.id} repo={repo} onSelect={handleSelectRepo} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── GITHUB CONFIRM ──────────────────────────────────────── */}
      {mode === "github" && step === "confirm" && selectedRepo && (
        <form onSubmit={handleGithubSubmit} className="space-y-5">
          {/* Repo card preview */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24292f] flex items-center justify-center shrink-0 mt-0.5">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-900">{selectedRepo.fullName}</span>
                {selectedRepo.isPrivate && (
                  <span className="text-[10px] font-semibold bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                    Private
                  </span>
                )}
              </div>
              {selectedRepo.description && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{selectedRepo.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <LangDot lang={selectedRepo.language} />
                <span className="text-xs text-zinc-400">
                  Branch: <code className="font-mono">{selectedRepo.defaultBranch}</code>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="text-xs text-[#5850ec] hover:underline shrink-0"
            >
              Change
            </button>
          </div>

          {/* Custom fields */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Project details</h2>

            <Field id="confirm-name" label="Project name" required>
              <input
                id="confirm-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="input-field"
                placeholder="e.g. platform-api"
              />
            </Field>

            <Field id="confirm-desc" label="Description" hint="Optional">
              <textarea
                id="confirm-desc"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="What does this project do?"
              />
            </Field>

            <Field id="confirm-branch" label="Default branch" required>
              <input
                id="confirm-branch"
                type="text"
                value={customBranch}
                onChange={(e) => setCustomBranch(e.target.value)}
                required
                className="input-field"
                placeholder="main"
              />
            </Field>
          </div>

          {mutError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{(mutError as Error).message}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              ← Back to repositories
            </button>
            <button
              id="confirm-create-github-btn"
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M10 3a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5h-6.5a.75.75 0 010-1.5h6.5v-6.5A.75.75 0 0110 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── MANUAL MODE ─────────────────────────────────────────── */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-5">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Project details</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field id="manual-name" label="Project name" required>
                <input
                  id="manual-name"
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="input-field"
                  placeholder="e.g. payment-service"
                />
              </Field>
              <Field id="manual-language" label="Language" hint="Optional">
                <input
                  id="manual-language"
                  type="text"
                  value={manualForm.language}
                  onChange={(e) => setManualForm((f) => ({ ...f, language: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. TypeScript, Java…"
                />
              </Field>
            </div>

            <Field id="manual-repo" label="Repository URL" required>
              <input
                id="manual-repo"
                type="url"
                value={manualForm.repositoryUrl}
                onChange={(e) => setManualForm((f) => ({ ...f, repositoryUrl: e.target.value }))}
                required
                className="input-field"
                placeholder="https://github.com/owner/repo"
              />
            </Field>

            <Field id="manual-branch" label="Default branch" required>
              <input
                id="manual-branch"
                type="text"
                value={manualForm.defaultBranch}
                onChange={(e) => setManualForm((f) => ({ ...f, defaultBranch: e.target.value }))}
                required
                className="input-field"
                placeholder="main"
              />
            </Field>

            <Field id="manual-desc" label="Description" hint="Optional">
              <textarea
                id="manual-desc"
                value={manualForm.description}
                onChange={(e) => setManualForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="input-field resize-none"
                placeholder="What does this project do?"
              />
            </Field>
          </div>

          {mutError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{(mutError as Error).message}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              id="manual-create-btn"
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M10 3a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5h-6.5a.75.75 0 010-1.5h6.5v-6.5A.75.75 0 0110 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #18181b;
          background-color: #f9fafb;
          border: 1px solid #e4e4e7;
          border-radius: 0.625rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .input-field:focus {
          border-color: #5850ec;
          box-shadow: 0 0 0 3px rgba(88, 80, 236, 0.1);
          background-color: #fff;
        }
        .input-field::placeholder {
          color: #a1a1aa;
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
        {label}
        {required && <span className="text-[#5850ec]">*</span>}
        {hint && <span className="text-zinc-400 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function RepoRow({
  repo,
  onSelect,
}: {
  repo: GithubRepo;
  onSelect: (r: GithubRepo) => void;
}) {
  return (
    <button
      type="button"
      id={`repo-row-${repo.id}`}
      onClick={() => onSelect(repo)}
      className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors text-left group"
    >
      {/* Repo icon */}
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-zinc-200 transition-colors">
        {repo.isPrivate ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-500">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-500">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-800 group-hover:text-[#5850ec] transition-colors">
            {repo.fullName}
          </span>
          {repo.isPrivate && (
            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
              Private
            </span>
          )}
        </div>
        {repo.description && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{repo.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <LangDot lang={repo.language} />
          {repo.updatedAt && (
            <span className="text-[11px] text-zinc-400">{timeAgo(repo.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 text-zinc-300 group-hover:text-[#5850ec] shrink-0 mt-1 transition-colors"
      >
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
