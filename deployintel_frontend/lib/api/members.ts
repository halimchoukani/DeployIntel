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
  if (res.status === 204) {
    return {} as T;
  }
  return res.json() as Promise<T>;
}

// --- Types ---

export type ProjectRole = "OWNER" | "MAINTAINER" | "DEVELOPER" | "VIEWER";

export type ProjectPermission =
  | "VIEW_PROJECT"
  | "TRIGGER_GATES"
  | "MANAGE_RELEASES"
  | "MANAGE_ENVIRONMENTS"
  | "MANAGE_MEMBERS"
  | "MANAGE_SETTINGS"
  | "DELETE_PROJECT";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED" | "EXPIRED";

export interface ProjectMember {
  id: string;
  userId?: string;
  projectId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: ProjectRole;
  permissions: ProjectPermission[];
  joinedAt: string;
  isOwner: boolean;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName?: string;
  email: string;
  role: ProjectRole;
  invitedByEmail?: string;
  status: InvitationStatus;
  token?: string;
  createdAt: string;
  expiresAt: string;
}

export interface InviteMemberPayload {
  email: string;
  role: ProjectRole;
}

export interface UpdateMemberRolePayload {
  role: ProjectRole;
}

// --- Project Members API ---

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/members`, {
    headers: apiHeaders(),
  });
  return handleResponse<ProjectMember[]>(res);
}

export async function inviteMember(
  projectId: string,
  payload: InviteMemberPayload
): Promise<ProjectMember> {
  const res = await fetch(`/api/v1/projects/${projectId}/members`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectMember>(res);
}

export async function updateMemberRole(
  projectId: string,
  memberId: string,
  payload: UpdateMemberRolePayload
): Promise<ProjectMember> {
  const res = await fetch(`/api/v1/projects/${projectId}/members/${memberId}`, {
    method: "PATCH",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ProjectMember>(res);
}

export async function removeMember(projectId: string, memberId: string): Promise<void> {
  const res = await fetch(`/api/v1/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
    headers: apiHeaders(),
  });
  return handleResponse<void>(res);
}

export async function leaveProject(projectId: string): Promise<void> {
  const res = await fetch(`/api/v1/projects/${projectId}/members/leave`, {
    method: "POST",
    headers: apiHeaders(),
  });
  return handleResponse<void>(res);
}

export async function getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/members/invitations`, {
    headers: apiHeaders(),
  });
  return handleResponse<ProjectInvitation[]>(res);
}

export async function revokeInvitation(projectId: string, invitationId: string): Promise<void> {
  const res = await fetch(`/api/v1/projects/${projectId}/members/invitations/${invitationId}`, {
    method: "DELETE",
    headers: apiHeaders(),
  });
  return handleResponse<void>(res);
}

// --- Global User Invitations API ---

export async function getMyPendingInvitations(): Promise<ProjectInvitation[]> {
  const res = await fetch("/api/v1/invitations/pending", {
    headers: apiHeaders(),
  });
  return handleResponse<ProjectInvitation[]>(res);
}

export async function acceptInvitation(token: string): Promise<ProjectMember> {
  const res = await fetch(`/api/v1/invitations/${token}/accept`, {
    method: "POST",
    headers: apiHeaders(),
  });
  return handleResponse<ProjectMember>(res);
}

export async function declineInvitation(token: string): Promise<void> {
  const res = await fetch(`/api/v1/invitations/${token}/decline`, {
    method: "POST",
    headers: apiHeaders(),
  });
  return handleResponse<void>(res);
}
