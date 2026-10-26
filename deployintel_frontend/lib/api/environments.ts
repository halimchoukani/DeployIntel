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
  if (res.status === 204) {
    return {} as T;
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────

export type EnvironmentStatus =
  | "PENDING"
  | "STARTING"
  | "RUNNING"
  | "STOPPED"
  | "FAILED"
  | "TERMINATED";

export interface TestEnvironment {
  id: string;
  projectId: string;
  name: string;
  containerId: string | null;
  containerName: string | null;
  image: string;
  status: EnvironmentStatus;
  portMapping: string | null;
  environmentVariables: string | null;
  workspacePath: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnvironmentPayload {
  name?: string;
  image?: string;
  port?: number;
  environmentVariables?: Record<string, string>;
  workspacePath?: string;
  autoClone?: boolean;
  installSemgrep?: boolean;
}

export interface CommandExecutionResponse {
  exitCode: number;
  output: string;
  success: boolean;
}

export interface ExecuteCommandPayload {
  command: string;
  workingDir?: string;
}

export interface EnvironmentLogsResponse {
  environmentId: string;
  containerId: string;
  logs: string;
}

export interface DockerDaemonStatus {
  connected: boolean;
  dockerHost: string;
  serverVersion: string;
  operatingSystem: string;
  totalContainers: number;
  statusMessage: string;
}

// ── API functions ─────────────────────────────────────────────────────

export async function getEnvironmentsForProject(
  projectId: string
): Promise<TestEnvironment[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/environments`, {
    headers: apiHeaders(),
  });
  return handleResponse<TestEnvironment[]>(res);
}

export async function getEnvironmentById(
  projectId: string,
  environmentId: string
): Promise<TestEnvironment> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/environments/${environmentId}`,
    {
      headers: apiHeaders(),
    }
  );
  return handleResponse<TestEnvironment>(res);
}

export async function createEnvironment(
  projectId: string,
  payload: CreateEnvironmentPayload
): Promise<TestEnvironment> {
  const res = await fetch(`/api/v1/projects/${projectId}/environments`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TestEnvironment>(res);
}

export async function startEnvironment(
  projectId: string,
  environmentId: string
): Promise<TestEnvironment> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/environments/${environmentId}/start`,
    {
      method: "POST",
      headers: apiHeaders(),
    }
  );
  return handleResponse<TestEnvironment>(res);
}

export async function stopEnvironment(
  projectId: string,
  environmentId: string
): Promise<TestEnvironment> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/environments/${environmentId}/stop`,
    {
      method: "POST",
      headers: apiHeaders(),
    }
  );
  return handleResponse<TestEnvironment>(res);
}

export async function deleteEnvironment(
  projectId: string,
  environmentId: string
): Promise<void> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/environments/${environmentId}`,
    {
      method: "DELETE",
      headers: apiHeaders(),
    }
  );
  await handleResponse<void>(res);
}

export async function getEnvironmentLogs(
  projectId: string,
  environmentId: string,
  tail: number = 100
): Promise<EnvironmentLogsResponse> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/environments/${environmentId}/logs?tail=${tail}`,
    {
      headers: apiHeaders(),
    }
  );
  return handleResponse<EnvironmentLogsResponse>(res);
}

export async function executeCommand(
  projectId: string,
  environmentId: string,
  payload: ExecuteCommandPayload
): Promise<CommandExecutionResponse> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/environments/${environmentId}/exec`,
    {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<CommandExecutionResponse>(res);
}

export async function getDockerDaemonStatus(): Promise<DockerDaemonStatus> {
  const res = await fetch("/api/v1/docker/status", {
    headers: apiHeaders(),
  });
  return handleResponse<DockerDaemonStatus>(res);
}