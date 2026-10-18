import { getAuthToken, performAutoLogout } from "@/lib/auth/session";
import type {
  AdminUser,
  AdminProject,
  AdminKpiData,
  AdminUserFilters,
  AdminProjectFilters,
  UserStatus,
  UserRole,
  ProjectStatus,
} from "@/types/admin";

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

// --- KPI Metrics -------------------------------------------------------------

export async function getAdminKpis(): Promise<AdminKpiData> {
  const res = await fetch("/api/v1/admin/kpis", {
    headers: apiHeaders(),
  });
  return handleResponse<AdminKpiData>(res);
}

// --- User Management ---------------------------------------------------------

export async function getAdminUsers(filters?: AdminUserFilters): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.append("search", filters.search.trim());
  if (filters?.status) params.append("status", filters.status);
  if (filters?.role) params.append("role", filters.role);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`/api/v1/admin/users${query}`, {
    headers: apiHeaders(),
  });
  return handleResponse<AdminUser[]>(res);
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
  const res = await fetch(`/api/v1/admin/users/${userId}`, {
    headers: apiHeaders(),
  });
  return handleResponse<AdminUser>(res);
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<AdminUser> {
  const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: apiHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<AdminUser>(res);
}

export async function blockUser(userId: string): Promise<AdminUser> {
  const res = await fetch(`/api/v1/admin/users/${userId}/block`, {
    method: "PATCH",
    headers: apiHeaders(),
  });
  return handleResponse<AdminUser>(res);
}

export async function activateUser(userId: string): Promise<AdminUser> {
  const res = await fetch(`/api/v1/admin/users/${userId}/activate`, {
    method: "PATCH",
    headers: apiHeaders(),
  });
  return handleResponse<AdminUser>(res);
}

export async function updateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
  const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: apiHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse<AdminUser>(res);
}

// --- Project Management ------------------------------------------------------

export async function getAdminProjects(filters?: AdminProjectFilters): Promise<AdminProject[]> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.append("search", filters.search.trim());
  if (filters?.status) params.append("status", filters.status);
  if (filters?.language) params.append("language", filters.language);
  if (filters?.ownerId) params.append("ownerId", filters.ownerId);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`/api/v1/admin/projects${query}`, {
    headers: apiHeaders(),
  });
  return handleResponse<AdminProject[]>(res);
}

export async function getAdminProject(projectId: string): Promise<AdminProject> {
  const res = await fetch(`/api/v1/admin/projects/${projectId}`, {
    headers: apiHeaders(),
  });
  return handleResponse<AdminProject>(res);
}

export async function updateAdminProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<AdminProject> {
  const res = await fetch(`/api/v1/admin/projects/${projectId}/status`, {
    method: "PATCH",
    headers: apiHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<AdminProject>(res);
}

export async function archiveAdminProject(projectId: string): Promise<AdminProject> {
  const res = await fetch(`/api/v1/admin/projects/${projectId}/archive`, {
    method: "PATCH",
    headers: apiHeaders(),
  });
  return handleResponse<AdminProject>(res);
}

export async function activateAdminProject(projectId: string): Promise<AdminProject> {
  const res = await fetch(`/api/v1/admin/projects/${projectId}/activate`, {
    method: "PATCH",
    headers: apiHeaders(),
  });
  return handleResponse<AdminProject>(res);
}

export async function deleteAdminProject(projectId: string): Promise<void> {
  const res = await fetch(`/api/v1/admin/projects/${projectId}`, {
    method: "DELETE",
    headers: apiHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Failed to delete project (status ${res.status})`);
  }
}
