import { getAuthToken, performAutoLogout } from "@/lib/auth/session";

function getToken(): string {
  const token = getAuthToken();
  if (!token) {
    performAutoLogout("unauthorized");
    throw new Error("No authentication token found");
  }
  return token;
}

function apiHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      performAutoLogout("session_expired");
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// --- Types ---

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string;
  defaultBranch: string;
  language: string | null;
  ownerId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
  updatedAt: string | null;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  repositoryUrl: string;
  defaultBranch?: string;
  language?: string;
}

export interface CreateProjectFromGithubPayload {
  repository: string;
  name?: string;
  description?: string;
  defaultBranch?: string;
  language?: string;
  /** Optional PAT for email users who haven't connected GitHub via OAuth */
  githubToken?: string;
}

export interface UpdateProjectPayload {
  name: string;
  description?: string;
  repositoryUrl: string;
  defaultBranch: string;
  language?: string;
  status?: ProjectStatus;
}

// --- Project CRUD ---

export async function getUserProjects(status?: ProjectStatus): Promise<Project[]> {
  const url = status ? `/api/v1/projects?status=${status}` : "/api/v1/projects";
  const res = await fetch(url, { headers: apiHeaders() });
  return handleResponse<Project[]>(res);
}

export async function getProject(id: string): Promise<Project> {
  const res = await fetch(`/api/v1/projects/${id}`, { headers: apiHeaders() });
  return handleResponse<Project>(res);
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await fetch("/api/v1/projects", {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Project>(res);
}

export async function createProjectFromGithub(
  payload: CreateProjectFromGithubPayload
): Promise<Project> {
  const res = await fetch("/api/v1/projects/github", {
    method: "POST",
    headers: apiHeaders(payload.githubToken ? { "X-GitHub-Token": payload.githubToken } : undefined),
    body: JSON.stringify(payload),
  });
  return handleResponse<Project>(res);
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const res = await fetch(`/api/v1/projects/${id}`, {
    method: "PUT",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Project>(res);
}

export async function archiveProject(id: string): Promise<Project> {
  const res = await fetch(`/api/v1/projects/${id}/archive`, {
    method: "PATCH",
    headers: apiHeaders(),
  });
  return handleResponse<Project>(res);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/v1/projects/${id}`, {
    method: "DELETE",
    headers: apiHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Delete failed with status ${res.status}`);
  }
}

// --- GitHub Repo browsing ---

export async function getUserGithubRepos(githubToken?: string): Promise<GithubRepo[]> {
  const res = await fetch("/api/v1/projects/github/repositories", {
    headers: apiHeaders(githubToken ? { "X-GitHub-Token": githubToken } : undefined),
  });
  return handleResponse<GithubRepo[]>(res);
}

export async function getGithubRepoDetails(repoUrl: string, githubToken?: string): Promise<GithubRepo> {
  const res = await fetch(
    `/api/v1/projects/github/repository?url=${encodeURIComponent(repoUrl)}`,
    { headers: apiHeaders(githubToken ? { "X-GitHub-Token": githubToken } : undefined) }
  );
  return handleResponse<GithubRepo>(res);
}

// ─── CI/CD Workflow Push ──────────────────────────────────────────────────────

export interface WorkflowPushPayload {
  workflowContent: string;
  commitMessage?: string;
  githubToken?: string;
}

export interface WorkflowPushResult {
  filePath: string;
  commitSha: string;
  commitUrl: string;
  created: boolean;
}

export async function pushWorkflowFile(
  projectId: string,
  payload: WorkflowPushPayload,
  githubToken?: string
): Promise<WorkflowPushResult> {
  const res = await fetch(`/api/v1/projects/${projectId}/cicd/workflow`, {
    method: "POST",
    headers: apiHeaders(githubToken ? { "X-GitHub-Token": githubToken } : undefined),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Failed to push workflow (HTTP ${res.status})`);
  }
  return res.json() as Promise<WorkflowPushResult>;
}

// ─── CI/CD Token Generation ───────────────────────────────────────────────

export interface CicdTokenResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  projectId: string;
  createdBy: string;
}

export async function createCicdToken(
  projectId: string,
  expirationDays: number = 365
): Promise<CicdTokenResponse> {
  const res = await fetch(`/api/v1/projects/${projectId}/cicd/token`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ expirationDays }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Failed to create CI/CD token (HTTP ${res.status})`);
  }
  return res.json() as Promise<CicdTokenResponse>;
}