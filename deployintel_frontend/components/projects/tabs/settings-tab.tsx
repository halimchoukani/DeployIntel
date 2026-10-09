"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/api/project";
import { useArchiveProject, useDeleteProject } from "@/hooks/use-projects";
import { 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  AlertTriangle, 
  Trash2, 
  Archive, 
  ExternalLink,
  Edit 
} from "lucide-react";

interface SettingsTabProps {
  project: Project;
}

export function SettingsTab({ project }: SettingsTabProps) {
  const router = useRouter();
  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const webhookUrl = `https://api.deployintel.io/v1/webhooks/gate/${project.id}`;

  const githubActionsYaml = `name: DeployIntel Gate Check
on: [push, pull_request]

jobs:
  gate-verdict:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: DeployIntel Sentinel Scan
        uses: deployintel/sentinel-action@v1
        with:
          project_id: "${project.id}"
          api_token: \${{ secrets.DEPLOYINTEL_TOKEN }}
          fail_on_block: true`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(githubActionsYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(project.id);
      router.push("/projects");
    } catch {
      // error handled in mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(project.id);
      router.push("/projects");
    } catch {
      // error handled in mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. General Project Details Link */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Project Configuration</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Modify repository name, default branch, description, and language settings.
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/edit`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl transition-all shadow-xs"
        >
          <Edit className="w-3.5 h-3.5 text-zinc-500" />
          <span>Edit Metadata</span>
        </Link>
      </div>

      {/* 2. CI/CD Webhook & Token */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">CI/CD Webhook Trigger</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Use this webhook in your GitHub Actions, GitLab CI, or Jenkins pipelines to trigger pre-flight gate evaluations.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Webhook URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 h-9 px-3 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 outline-none select-all"
            />
            <button
              onClick={copyWebhook}
              className="h-9 px-3.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{copiedWebhook ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#5850ec]" />
              GitHub Actions Workflow Snippet (.github/workflows/deployintel.yml)
            </label>
            <button
              onClick={copyYaml}
              className="text-xs text-[#5850ec] hover:underline font-semibold flex items-center gap-1"
            >
              {copiedYaml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedYaml ? "Copied snippet!" : "Copy YAML"}</span>
            </button>
          </div>
          <pre className="p-4 bg-zinc-900 text-zinc-200 text-xs font-mono rounded-xl overflow-x-auto leading-relaxed border border-zinc-800">
            {githubActionsYaml}
          </pre>
        </div>
      </div>

      {/* 3. Danger Zone */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-rose-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Danger Zone</h3>
        </div>
        <p className="text-xs text-zinc-500 mb-6">
          Irreversible actions. Archiving disables automated gate enforcement. Deleting removes all historical risk telemetry.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{archiveMutation.isPending ? "Archiving..." : "Archive Project"}</span>
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                <span>{deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 px-2 py-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
