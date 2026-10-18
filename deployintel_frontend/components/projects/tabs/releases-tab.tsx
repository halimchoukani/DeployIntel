"use client";

import React, { useState } from "react";
import { useReleases } from "@/hooks/use-releases";
import type { Release, ReleaseEnvironment, ReleaseStatus } from "@/lib/api/releases";
import type { Project } from "@/lib/api/project";
import {
  Tag,
  GitCommit,
  GitBranch,
  Clock,
  PackageCheck,
  PackageX,
  Package,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  Rocket,
} from "lucide-react";

interface ReleasesTabProps {
  project: Project;
}

function envBadge(env: ReleaseEnvironment) {
  const map: Record<ReleaseEnvironment, string> = {
    PRODUCTION: "bg-violet-50 text-violet-700 border-violet-200",
    STAGING: "bg-amber-50 text-amber-700 border-amber-200",
    DEVELOPMENT: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return map[env] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function statusIcon(status: ReleaseStatus) {
  switch (status) {
    case "SUCCESS":
      return <PackageCheck className="w-4 h-4 text-emerald-500" />;
    case "FAILED":
      return <PackageX className="w-4 h-4 text-rose-500" />;
    case "DRAFT":
      return <Package className="w-4 h-4 text-zinc-400" />;
    default:
      return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
  }
}

function statusLabel(status: ReleaseStatus) {
  const map: Record<ReleaseStatus, { label: string; cls: string }> = {
    SUCCESS: { label: "Success", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    FAILED: { label: "Failed", cls: "text-rose-600 bg-rose-50 border-rose-200" },
    DRAFT: { label: "Draft", cls: "text-zinc-500 bg-zinc-50 border-zinc-200" },
    PENDING: { label: "Pending", cls: "text-amber-600 bg-amber-50 border-amber-200" },
  };
  const s = map[status] ?? { label: status, cls: "text-zinc-500 bg-zinc-50 border-zinc-200" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      {statusIcon(status)}
      {s.label}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function shortSha(sha: string) {
  return sha.startsWith("refs/") ? sha : sha.slice(0, 7);
}

export function ReleasesTab({ project }: ReleasesTabProps) {
  const { data: releases, isLoading, error, refetch } = useReleases(project.id);
  const [selected, setSelected] = useState<Release | null>(null);
  const [envFilter, setEnvFilter] = useState<ReleaseEnvironment | "ALL">("ALL");

  const filtered = (releases ?? []).filter(
    (r) => envFilter === "ALL" || r.environment === envFilter
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">Loading releases…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-sm font-semibold text-zinc-700">Could not load releases</p>
        <p className="text-xs text-zinc-400 max-w-xs">{(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-xs font-semibold text-[#5850ec] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!releases || releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Rocket className="w-7 h-7 text-[#5850ec]" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-800">No releases yet</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Releases are created automatically when your GitHub Actions workflow runs on a new tag or publish event.
          </p>
        </div>
        <a
          href={`/projects/${project.id}?tab=settings`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5850ec] bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-4 py-2 rounded-xl transition-colors"
        >
          Set up CI/CD workflow
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Release History</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {releases.length} release{releases.length !== 1 ? "s" : ""} recorded via GitHub Actions
          </p>
        </div>
        {/* Environment filter */}
        <div className="flex items-center gap-1.5">
          {(["ALL", "PRODUCTION", "STAGING", "DEVELOPMENT"] as const).map((env) => (
            <button
              key={env}
              onClick={() => setEnvFilter(env)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                envFilter === env
                  ? "bg-[#5850ec] text-white border-[#5850ec] shadow-sm"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {env === "ALL" ? "All" : env.charAt(0) + env.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
              <th className="py-3 px-5 text-left">Version</th>
              <th className="py-3 px-4 text-left">Environment</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Commit</th>
              <th className="py-3 px-4 text-left">Branch / Tag</th>
              <th className="py-3 px-4 text-right">Released</th>
              <th className="py-3 px-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                  No releases matching the selected environment.
                </td>
              </tr>
            ) : (
              filtered.map((release) => (
                <tr
                  key={release.id}
                  onClick={() => setSelected(release)}
                  className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                >
                  {/* Version */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Tag className="w-3.5 h-3.5 text-[#5850ec]" />
                      </div>
                      <span className="font-bold text-zinc-900">{release.versionNumber}</span>
                    </div>
                  </td>

                  {/* Environment */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${envBadge(release.environment)}`}>
                      {release.environment.charAt(0) + release.environment.slice(1).toLowerCase()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {statusLabel(release.status)}
                  </td>

                  {/* Commit SHA */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                      {shortSha(release.commitSha)}
                    </span>
                  </td>

                  {/* Branch / Tag */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      {release.tag ? (
                        <>
                          <Tag className="w-3 h-3 text-zinc-400" />
                          <span className="font-mono">{release.tag}</span>
                        </>
                      ) : release.branch ? (
                        <>
                          <GitBranch className="w-3 h-3 text-zinc-400" />
                          <span className="font-mono">{release.branch}</span>
                        </>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="py-4 px-4 text-right whitespace-nowrap text-zinc-400">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(release.createdAt)}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(release); }}
                      className="text-xs font-semibold text-[#5850ec] hover:text-[#4d44e7] p-1.5 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-[#5850ec]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Release</p>
                  <h3 className="text-base font-bold text-zinc-900">{selected.versionNumber}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Status</p>
                {statusLabel(selected.status)}
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Environment</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${envBadge(selected.environment)}`}>
                  {selected.environment.charAt(0) + selected.environment.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Commit SHA</p>
                <span className="font-mono text-[11px] text-zinc-700 break-all">{selected.commitSha}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Tag</p>
                <span className="font-mono text-zinc-700">{selected.tag ?? "—"}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Branch</p>
                <span className="font-mono text-zinc-700">{selected.branch ?? "—"}</span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70">
                <p className="text-zinc-400 font-medium mb-1">Released</p>
                <span className="text-zinc-700">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
