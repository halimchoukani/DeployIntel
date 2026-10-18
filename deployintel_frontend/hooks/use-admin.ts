"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminKpis,
  getAdminUsers,
  getAdminUser,
  updateUserStatus,
  blockUser,
  activateUser,
  updateUserRole,
  getAdminProjects,
  getAdminProject,
  updateAdminProjectStatus,
  archiveAdminProject,
  activateAdminProject,
  deleteAdminProject,
} from "@/lib/api/admin";
import type {
  AdminUserFilters,
  AdminProjectFilters,
  UserStatus,
  UserRole,
  ProjectStatus,
} from "@/types/admin";

// --- KPI Queries -------------------------------------------------------------

export function useAdminKpis() {
  return useQuery({
    queryKey: ["admin_kpis"],
    queryFn: getAdminKpis,
    retry: 1,
    staleTime: 30 * 1000,
  });
}

// --- User Queries & Mutations ------------------------------------------------

export function useAdminUsers(filters?: AdminUserFilters) {
  return useQuery({
    queryKey: ["admin_users", filters?.search, filters?.status, filters?.role],
    queryFn: () => getAdminUsers(filters),
    retry: 1,
    staleTime: 15 * 1000,
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ["admin_user", userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
    retry: 1,
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      updateUserStatus(userId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => activateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

// --- Project Queries & Mutations ---------------------------------------------

export function useAdminProjects(filters?: AdminProjectFilters) {
  return useQuery({
    queryKey: [
      "admin_projects",
      filters?.search,
      filters?.status,
      filters?.language,
      filters?.ownerId,
    ],
    queryFn: () => getAdminProjects(filters),
    retry: 1,
    staleTime: 15 * 1000,
  });
}

export function useAdminProject(projectId: string) {
  return useQuery({
    queryKey: ["admin_project", projectId],
    queryFn: () => getAdminProject(projectId),
    enabled: Boolean(projectId),
    retry: 1,
  });
}

export function useUpdateAdminProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      status,
    }: {
      projectId: string;
      status: ProjectStatus;
    }) => updateAdminProjectStatus(projectId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_projects"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

export function useArchiveAdminProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => archiveAdminProject(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_projects"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

export function useActivateAdminProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => activateAdminProject(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_projects"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}

export function useDeleteAdminProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => deleteAdminProject(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_projects"] });
      qc.invalidateQueries({ queryKey: ["admin_kpis"] });
    },
  });
}
