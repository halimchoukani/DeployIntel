"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useProject, useUpdateProject } from "@/hooks/use-projects";

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const { data: project, isLoading: isProjectLoading, error: projectError } = useProject(id);
  const updateProjectMutation = useUpdateProject(id);

  const [form, setForm] = useState({
    name: "",
    description: "",
    repositoryUrl: "",
    defaultBranch: "",
    language: "",
    status: "ACTIVE" as "ACTIVE" | "ARCHIVED",
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || "",
        repositoryUrl: project.repositoryUrl,
        defaultBranch: project.defaultBranch,
        language: project.language || "",
        status: project.status,
      });
    }
  }, [project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProjectMutation.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        repositoryUrl: form.repositoryUrl,
        defaultBranch: form.defaultBranch,
        language: form.language || undefined,
        status: form.status,
      });
      router.push("/projects");
    } catch {
      // error shown via mutation state
    }
  }

  const isPending = updateProjectMutation.isPending;
  const mutError = updateProjectMutation.error;

  if (isProjectLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Loading project details…</p>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-500">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Failed to load project</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            {projectError instanceof Error ? projectError.message : "The project might not exist or you don't have access to it."}
          </p>
        </div>
        <button
          onClick={() => router.push("/projects")}
          className="mt-4 text-sm text-[#5850ec] font-medium hover:underline"
        >
          Return to projects
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-[860px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
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
          <h1 className="text-2xl font-bold text-zinc-900 leading-tight">Edit Project</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Update settings for <span className="font-semibold">{project.name}</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Project details</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field id="edit-name" label="Project name" required>
              <input
                id="edit-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="input-field"
                placeholder="e.g. payment-service"
              />
            </Field>
            <Field id="edit-language" label="Language" hint="Optional">
              <input
                id="edit-language"
                type="text"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                className="input-field"
                placeholder="e.g. TypeScript, Java…"
              />
            </Field>
          </div>

          <Field id="edit-repo" label="Repository URL" required>
            <input
              id="edit-repo"
              type="url"
              value={form.repositoryUrl}
              readOnly
              disabled
              className="input-field opacity-60 cursor-not-allowed bg-zinc-100"
              placeholder="https://github.com/owner/repo"
            />
          </Field>

          <Field id="edit-branch" label="Default branch" required>
            <input
              id="edit-branch"
              type="text"
              value={form.defaultBranch}
              onChange={(e) => setForm((f) => ({ ...f, defaultBranch: e.target.value }))}
              required
              className="input-field"
              placeholder="main"
            />
          </Field>

          <Field id="edit-desc" label="Description" hint="Optional">
            <textarea
              id="edit-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder="What does this project do?"
            />
          </Field>

          <Field id="edit-status" label="Status" required>
            <select
              id="edit-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              className="input-field"
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
        </div>

        {mutError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{(mutError as Error).message}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            id="edit-save-btn"
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>

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
