"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/api/project";
import { useArchiveProject, useDeleteProject, usePushWorkflow, useCreateCicdToken } from "@/hooks/use-projects";
import {
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Trash2,
  Archive,
  Edit,
  Workflow,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  GitFork,
  Loader2,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Key,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface SettingsTabProps {
  project: Project;
}

const buildWorkflowYaml = (
  projectId: string,
  token?: string | null,
  embedToken: boolean = false,
  apiUrl?: string
) => {
  const tokenExpr = embedToken && token ? token : "\${{ secrets.DEPLOYINTEL_TOKEN }}";
  const urlExpr = apiUrl && apiUrl.trim()
    ? apiUrl.trim()
    : embedToken
    ? (typeof window !== "undefined" && window.location.origin.includes("localhost")
        ? "http://localhost:8080"
        : "\${{ secrets.DEPLOYINTEL_API_URL }}")
    : "\${{ secrets.DEPLOYINTEL_API_URL }}";

  return `name: DeployIntel Release Tracker
on:
  release:
    types: [published]

jobs:
  notify-deployintel:
    runs-on: ubuntu-latest
    steps:
      - name: Notify DeployIntel of new release
        run: |
          curl -s -X POST "${urlExpr}/api/v1/releases" \\
            -H "Authorization: Bearer ${tokenExpr}" \\
            -H "Content-Type: application/json" \\
            -d '{
                  "projectId": "${projectId}",
                  "versionNumber": "\${{ github.ref_name }}",
                  "commitSha": "\${{ github.sha }}",
                  "branch": "\${{ github.ref_name }}",
                  "tag": "\${{ github.ref_name }}",
                  "environment": "PRODUCTION"
                }'
`;
};

const DEFAULT_WORKFLOW = (projectId: string) => buildWorkflowYaml(projectId);

type PushState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; commitUrl: string; created: boolean }
  | { type: "error"; message: string };

export function SettingsTab({ project }: SettingsTabProps) {
  const router = useRouter();
  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();
  const pushWorkflowMutation = usePushWorkflow(project.id);
  const createTokenMutation = useCreateCicdToken(project.id);

  // CI/CD Token state
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  const [showGeneratedToken, setShowGeneratedToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);
  const [embedToken, setEmbedToken] = useState(false);
  const [tokenDuration, setTokenDuration] = useState<number>(365);
  const [tokenFlash, setTokenFlash] = useState(false);
  const [apiUrlOverride, setApiUrlOverride] = useState<string>("");

  // Copy states
  const [copiedId, setCopiedId] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Workflow editor state
  const [workflowContent, setWorkflowContent] = useState(DEFAULT_WORKFLOW(project.id));
  const [editorOpen, setEditorOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Push to GitHub state
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [pushState, setPushState] = useState<PushState>({ type: "idle" });
  const [pushSectionOpen, setPushSectionOpen] = useState(false);

  const copyProjectId = () => {
    navigator.clipboard.writeText(project.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(workflowContent);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const downloadYaml = () => {
    const blob = new Blob([workflowContent], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deployintel-release.yml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateToken = async () => {
    try {
      const res = await createTokenMutation.mutateAsync(tokenDuration);
      setGeneratedToken(res.token);
      setTokenExpiry(res.expiresAt);
      setEmbedToken(true);
      setWorkflowContent(buildWorkflowYaml(project.id, res.token, true, apiUrlOverride));
      setTokenFlash(true);
      setTimeout(() => setTokenFlash(false), 3000);
    } catch (err: unknown) {
      console.error("Failed to generate token", err);
    }
  };

  const toggleEmbedToken = () => {
    const next = !embedToken;
    setEmbedToken(next);
    setWorkflowContent(buildWorkflowYaml(project.id, generatedToken, next, apiUrlOverride));
  };

  const copyGeneratedToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSaveWorkflow = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const handleResetWorkflow = () => {
    setWorkflowContent(buildWorkflowYaml(project.id, generatedToken, embedToken, apiUrlOverride));
  };

  const handlePushToGithub = async () => {
    setPushState({ type: "loading" });
    try {
      const result = await pushWorkflowMutation.mutateAsync({
        payload: {
          workflowContent,
          commitMessage: commitMsg.trim() || undefined,
          githubToken: githubToken.trim() || undefined,
        },
        githubToken: githubToken.trim() || undefined,
      });
      setPushState({
        type: "success",
        commitUrl: result.commitUrl,
        created: result.created,
      });
    } catch (err: unknown) {
      setPushState({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(project.id);
      router.push("/projects");
    } catch { /* handled in mutation */ }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(project.id);
      router.push("/projects");
    } catch { /* handled in mutation */ }
  };

  return (
    <div className="space-y-6">
      {/* 1. General Project Details */}
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

      {/* 2. GitHub Actions CI/CD Setup */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {/* Section header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 mb-1">
            <Workflow className="w-4 h-4 text-[#5850ec]" />
            <h3 className="text-sm font-bold text-zinc-900">GitHub Actions CI/CD Integration</h3>
          </div>
          <p className="text-xs text-zinc-500">
            Add this workflow to{" "}
            <code className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
              .github/workflows/deployintel-release.yml
            </code>{" "}
            — or push it directly from here using your GitHub token.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1 — Token Creation & Workflow Authentication */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#5850ec] text-white text-[10px] flex items-center justify-center font-bold shrink-0">1</span>
                Create CI/CD Access Token & Authentication
              </p>
              {tokenFlash && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Token generated & applied to workflow!
                </span>
              )}
            </div>

            {/* Token Generation Box */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      DeployIntel CI/CD Token
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#5850ec]/10 text-[#5850ec]">
                        Recommended
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Generate a long-lived token to authenticate the GitHub Action release tracker.
                    </p>
                  </div>
                </div>

                {!generatedToken ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={tokenDuration}
                      onChange={(e) => setTokenDuration(Number(e.target.value))}
                      className="text-xs bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 outline-none focus:border-[#5850ec] shadow-2xs"
                    >
                      <option value={365}>1 Year (Recommended)</option>
                      <option value={90}>90 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                    <button
                      onClick={handleGenerateToken}
                      disabled={createTokenMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4b43d6] px-3.5 py-2 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {createTokenMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {createTokenMutation.isPending ? "Generating..." : "Generate Token"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateToken}
                      disabled={createTokenMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${createTokenMutation.isPending ? "animate-spin" : ""}`} />
                      Regenerate
                    </button>
                  </div>
                )}
              </div>

              {/* Active Token Display */}
              {generatedToken && (
                <div className="space-y-3 pt-3 border-t border-indigo-100/60">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Generated CI/CD Token
                      </label>
                      {tokenExpiry && (
                        <span className="text-[11px] text-zinc-400">
                          Expires: {new Date(tokenExpiry).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showGeneratedToken ? "text" : "password"}
                          readOnly
                          value={generatedToken}
                          className="w-full h-9 pl-3 pr-10 text-xs font-mono bg-white border border-zinc-200 rounded-xl text-zinc-800 outline-none select-all focus:border-[#5850ec]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeneratedToken((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                          {showGeneratedToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        onClick={copyGeneratedToken}
                        className="h-9 px-3 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                        {copiedToken ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Direct Embed Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/90 border border-indigo-100 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${embedToken ? "bg-emerald-500 animate-pulse" : "bg-zinc-300"}`} />
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">
                          Include token directly in workflow file
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {embedToken
                            ? "Token is embedded in Step 2. GitHub Actions will work immediately without manual secrets!"
                            : "Token is kept as \${{ secrets.DEPLOYINTEL_TOKEN }}. Add it to GitHub repository secrets below."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleEmbedToken}
                      className={`h-7 px-3 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        embedToken
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200"
                      }`}
                    >
                      {embedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Sparkles className="w-3 h-3 text-[#5850ec]" />}
                      {embedToken ? "Added to Workflow" : "Add to Workflow"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* GitHub Repository Secrets Reference */}
            <div className="rounded-xl border border-zinc-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Secret / Parameter</th>
                    <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Status / Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr className={embedToken ? "bg-emerald-50/30" : ""}>
                    <td className="py-3 px-4 font-mono text-zinc-800 font-semibold">DEPLOYINTEL_TOKEN</td>
                    <td className="py-3 px-4">
                      {embedToken ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Included in workflow file
                        </span>
                      ) : generatedToken ? (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[11px]">Token generated</span>
                          <button
                            onClick={copyGeneratedToken}
                            className="h-6 px-2 text-[10px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            {copiedToken ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                            {copiedToken ? "Copied" : "Copy Token"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">
                          Click &quot;Generate Token&quot; above or use your personal JWT
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-zinc-800 font-semibold">DEPLOYINTEL_API_URL</td>
                    <td className="py-3 px-4 text-zinc-500">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                          {typeof window !== "undefined" && window.location.origin.includes("localhost")
                            ? "http://localhost:8080"
                            : "https://api.deployintel.io"}
                        </code>
                        <button
                          onClick={() => {
                            const url = typeof window !== "undefined" && window.location.origin.includes("localhost")
                              ? "http://localhost:8080"
                              : "https://api.deployintel.io";
                            navigator.clipboard.writeText(url);
                            setCopiedApiUrl(true);
                            setTimeout(() => setCopiedApiUrl(false), 2000);
                          }}
                          className="h-6 px-2 text-[10px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          {copiedApiUrl ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          {copiedApiUrl ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-indigo-50/40">
                    <td className="py-3 px-4 font-mono text-zinc-800 font-semibold">DEPLOYINTEL_PROJECT_ID</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-[11px] bg-white border border-zinc-200 px-2 py-1 rounded text-zinc-700 select-all">
                          {project.id}
                        </code>
                        <button
                          onClick={copyProjectId}
                          className="h-7 px-2.5 text-[11px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedId ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2 — Workflow editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#5850ec] text-white text-[10px] flex items-center justify-center font-bold shrink-0">2</span>
                Workflow file
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#5850ec]" />
                  {editorOpen ? "Collapse" : "Edit workflow"}
                  {editorOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={copyYaml}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                >
                  {copiedYaml ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                  {copiedYaml ? "Copied!" : "Copy YAML"}
                </button>
                <button
                  onClick={downloadYaml}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                >
                  <Download className="w-3 h-3 text-zinc-500" />
                  Download
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-800">
              <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono ml-1">.github/workflows/deployintel-release.yml</span>
                </div>
                {editorOpen && (
                  <span className="text-[10px] font-semibold text-[#5850ec] bg-indigo-900/40 border border-indigo-700/50 px-2 py-0.5 rounded-full">
                    Editing
                  </span>
                )}
              </div>

              {editorOpen ? (
                <textarea
                  value={workflowContent}
                  onChange={(e) => setWorkflowContent(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-zinc-950 text-zinc-200 text-xs font-mono p-4 leading-relaxed outline-none resize-none min-h-[300px] focus:ring-0"
                  style={{ tabSize: 2 }}
                />
              ) : (
                <pre className="p-4 bg-zinc-900 text-zinc-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-72 overflow-y-auto">
                  {workflowContent}
                </pre>
              )}
            </div>

            {editorOpen && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Changes are local — use "Push to GitHub" below or download the file.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetWorkflow}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    Reset to default
                  </button>
                  <button
                    onClick={handleSaveWorkflow}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-all ${
                      savedFlash ? "bg-emerald-500 text-white" : "bg-[#5850ec] hover:bg-[#4d44e7] text-white shadow-sm"
                    }`}
                  >
                    {savedFlash ? <><Check className="w-3 h-3" /> Saved locally</> : "Apply changes"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 3 — Push to GitHub */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => { setPushSectionOpen((v) => !v); setPushState({ type: "idle" }); }}
              className="w-full flex items-center justify-between px-5 py-4 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#5850ec] text-white text-[10px] flex items-center justify-center font-bold shrink-0">3</span>
                <div>
                  <p className="text-xs font-bold text-zinc-800 flex items-center gap-2">
                    <GitFork className="w-3.5 h-3.5" />
                    Push directly to GitHub
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    DeployIntel will commit the workflow file to your repository using the GitHub API.
                  </p>
                </div>
              </div>
              {pushSectionOpen ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
            </button>

            {pushSectionOpen && (
              <div className="px-5 py-5 space-y-4 border-t border-zinc-200">
                {/* Token input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    GitHub Personal Access Token
                    <span className="text-zinc-400 font-normal">(optional if you signed in via GitHub OAuth)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                      className="w-full h-9 pl-3 pr-10 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 outline-none focus:border-[#5850ec] focus:ring-1 focus:ring-[#5850ec]/20 transition-all placeholder:text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    GitHub requires the <code className="bg-zinc-100 px-1 rounded text-zinc-700 font-mono">workflow</code> + <code className="bg-zinc-100 px-1 rounded text-zinc-700 font-mono">repo</code> scopes (classic PAT) or <code className="bg-zinc-100 px-1 rounded text-zinc-700 font-mono">Workflows: Read & write</code> (fine-grained PAT).
                    Never stored — used only for this request.
                  </p>
                </div>

                {/* Custom commit message */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Commit message <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    placeholder="ci: add DeployIntel release tracker workflow"
                    className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 outline-none focus:border-[#5850ec] focus:ring-1 focus:ring-[#5850ec]/20 transition-all placeholder:text-zinc-300"
                  />
                </div>

                {/* Result feedback */}
                {pushState.type === "success" && (
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-800">
                        {pushState.created ? "Workflow file created!" : "Workflow file updated!"}
                      </p>
                      <p className="text-emerald-700 mt-0.5">
                        Committed to{" "}
                        <code className="font-mono text-[11px] bg-emerald-100 px-1 rounded">
                          .github/workflows/deployintel-release.yml
                        </code>
                      </p>
                      {pushState.commitUrl && (
                        <a
                          href={pushState.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold mt-1.5 underline"
                        >
                          View commit on GitHub
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {pushState.type === "error" && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-rose-800">Failed to push workflow file</p>
                      <p className="text-rose-700 mt-0.5">{pushState.message}</p>
                    </div>
                  </div>
                )}

                {/* Push button */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    Target repo: <code className="font-mono bg-zinc-100 px-1 rounded ml-0.5">{project.repositoryUrl}</code>
                  </p>
                  <button
                    onClick={handlePushToGithub}
                    disabled={pushState.type === "loading"}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {pushState.type === "loading" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Pushing to GitHub…
                      </>
                    ) : (
                      <>
                        <GitFork className="w-3.5 h-3.5" />
                        Push workflow to GitHub
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
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