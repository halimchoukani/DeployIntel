"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import type { AdminProject } from "@/types/admin";
import { useDeleteAdminProject } from "@/hooks/use-admin";

interface DeleteProjectModalProps {
  project: AdminProject | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteProjectModal({ project, onClose, onSuccess }: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const deleteMutation = useDeleteAdminProject();

  if (!project) return null;

  const isConfirmed = confirmText.trim().toLowerCase() === project.name.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;
    try {
      await deleteMutation.mutateAsync(project.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 p-6">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Delete Project Permanently?</h3>
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          You are about to permanently delete{" "}
          <span className="font-bold text-zinc-900">{project.name}</span>. This will destroy all
          associated risk scores, gate configurations, policies, and webhook data. This action
          cannot be reversed.
        </p>

        <div className="mt-4 bg-rose-50/60 border border-rose-100 rounded-xl p-3">
          <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
            Type <span className="underline select-all">{project.name}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={project.name}
            className="w-full text-xs px-3 py-2 rounded-lg border border-rose-200 bg-white text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {deleteMutation.isError && (
          <p className="text-xs text-rose-600 font-medium mt-2">
            Failed to delete project. Please try again.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed || deleteMutation.isPending}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
