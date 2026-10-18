"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FolderGit2,
  Search,
  Filter,
  ExternalLink,
  Archive,
  ArchiveRestore,
  Trash2,
  GitBranch,
  Code2,
  User,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { DeleteProjectModal } from "@/components/admin/delete-project-modal";
import {
  useAdminProjects,
  useArchiveAdminProject,
  useActivateAdminProject,
} from "@/hooks/use-admin";
import type { AdminProject, ProjectStatus } from "@/types/admin";

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading projects...</div>}>
      <AdminProjectsContent />
    </Suspense>
  );
}

function AdminProjectsContent() {
  const searchParams = useSearchParams();
  const initialOwnerId = searchParams.get("ownerId") || "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [ownerIdFilter, setOwnerIdFilter] = useState(initialOwnerId);
  const [projectToDelete, setProjectToDelete] = useState<AdminProject | null>(null);

  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminProjects({
    search,
    status: statusFilter,
    language: languageFilter,
    ownerId: ownerIdFilter || undefined,
  });

  const archiveMutation = useArchiveAdminProject();
  const activateMutation = useActivateAdminProject();

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === "ACTIVE").length,
      archived: projects.filter((p) => p.status === "ARCHIVED").length,
    };
  }, [projects]);

  // Unique languages for filter dropdown
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.language) set.add(p.language);
    });
    return Array.from(set).sort();
  }, [projects]);

  const handleToggleArchive = async (project: AdminProject) => {
    try {
      if (project.status === "ARCHIVED") {
        await activateMutation.mutateAsync(project.id);
      } else {
        await archiveMutation.mutateAsync(project.id);
      }
    } catch (err) {
      console.error("Failed to update project status:", err);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <AdminHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* KPI Mini-counters */}
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Total Filtered</span>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-600">Active</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-amber-600">Archived</span>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.archived}</p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name or repository URL..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#5850ec] focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {ownerIdFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-[#5850ec]">
                <User className="w-3 h-3" />
                Filtered by Owner
                <button
                  type="button"
                  onClick={() => setOwnerIdFilter("")}
                  className="hover:text-indigo-900 ml-1 text-xs"
                >
                  ?
                </button>
              </span>
            )}

            {/* Language filter */}
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-medium focus:outline-none focus:border-[#5850ec]"
            >
              <option value="">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
              className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-medium focus:outline-none focus:border-[#5850ec]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {(search || statusFilter || languageFilter || ownerIdFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setLanguageFilter("");
                  setOwnerIdFilter("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#5850ec] mx-auto mb-3" />
              <p className="text-xs font-semibold text-zinc-600">Loading project catalog...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-xs font-semibold text-zinc-800">Failed to fetch projects</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-xs text-[#5850ec] font-semibold underline"
              >
                Try again
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-16 text-center">
              <FolderGit2 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800">No projects found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                No repositories match the current filters or search terms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Repository</th>
                    <th className="py-3 px-4">Language / Branch</th>
                    <th className="py-3 px-4">Project Owner</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {projects.map((p) => {
                    const shortUrl = p.repositoryUrl.replace(/^https?:\/\/github\.com\//, "");

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                        {/* Repository name & url */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/60 text-[#5850ec] flex items-center justify-center shrink-0 mt-0.5">
                              <FolderGit2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/projects/${p.id}`}
                                className="font-bold text-zinc-900 hover:text-[#5850ec] transition-colors truncate block max-w-[200px] sm:max-w-[260px]"
                              >
                                {p.name}
                              </Link>
                              <a
                                href={p.repositoryUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-zinc-400 hover:text-zinc-600 flex items-center gap-1 font-mono truncate max-w-[200px]"
                              >
                                <span>{shortUrl}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Language & Branch */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              <Code2 className="w-3 h-3 text-zinc-400" />
                              {p.language || "Other"}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                              <GitBranch className="w-3 h-3 text-zinc-400" />
                              <span>{p.defaultBranch}</span>
                            </div>
                          </div>
                        </td>

                        {/* Owner */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-800 truncate max-w-[150px]">
                              {p.ownerName || "Unknown Owner"}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[150px]">
                              {p.ownerEmail || "--"}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {p.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                              <Archive className="w-3 h-3 text-zinc-400" />
                              Archived
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Archive / Activate */}
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(p)}
                              disabled={archiveMutation.isPending || activateMutation.isPending}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors shadow-2xs"
                              title={p.status === "ACTIVE" ? "Archive Project" : "Restore Project"}
                            >
                              {p.status === "ACTIVE" ? (
                                <Archive className="w-3.5 h-3.5" />
                              ) : (
                                <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </button>

                            {/* Delete Project */}
                            <button
                              type="button"
                              onClick={() => setProjectToDelete(p)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition-colors shadow-2xs"
                              title="Delete Project Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <DeleteProjectModal
          project={projectToDelete}
          onClose={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
}
