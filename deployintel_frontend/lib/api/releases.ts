import { getAuthToken, performAutoLogout } from "@/lib/auth/session";

function getToken(): string {
  const token = getAuthToken();
  if (!token) {
    performAutoLogout("unauthorized");
    throw new Error("No authentication token found");
  }
  return token;
}

function apiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
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

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReleaseEnvironment = "DEVELOPMENT" | "STAGING" | "PRODUCTION";
export type ReleaseStatus = "PENDING" | "SUCCESS" | "FAILED" | "DRAFT";

export interface Release {
  id: string;
  projectId: string;
  versionNumber: string;
  commitSha: string;
  branch: string | null;
  tag: string | null;
  authorId: string | null;
  environment: ReleaseEnvironment;
  status: ReleaseStatus;
  createdAt: string;
}

export interface CreateReleasePayload {
  projectId: string;
  versionNumber: string;
  commitSha: string;
  branch?: string;
  tag?: string;
  environment: ReleaseEnvironment;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getReleasesForProject(projectId: string): Promise<Release[]> {
  const res = await fetch(`/api/v1/releases/project/${projectId}`, {
    headers: apiHeaders(),
  });
  return handleResponse<Release[]>(res);
}

export async function getReleaseById(releaseId: string): Promise<Release> {
  const res = await fetch(`/api/v1/releases/${releaseId}`, {
    headers: apiHeaders(),
  });
  return handleResponse<Release>(res);
}

export async function createRelease(payload: CreateReleasePayload): Promise<Release> {
  const res = await fetch("/api/v1/releases", {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Release>(res);
}
