"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserProjects,
  getProject,
  createProject,
  createProjectFromGithub,
  updateProject,
  archiveProject,
  deleteProject,
  getUserGithubRepos,
  type CreateProjectPayload,
  type CreateProjectFromGithubPayload,
  type UpdateProjectPayload,
  type ProjectStatus,
} from "@/lib/api/project";

export function useProjects(status?: ProjectStatus) {
  return useQuery({
    queryKey: ["projects", status],
    queryFn: () => getUserProjects(status),
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useCreateProjectFromGithub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectFromGithubPayload) => createProjectFromGithub(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => updateProject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useGithubRepos(githubToken?: string) {
  return useQuery({
    queryKey: ["github_repos", githubToken ?? "oauth"],
    queryFn: () => getUserGithubRepos(githubToken),
    retry: false,
    staleTime: 60 * 1000,
    enabled: !!githubToken || true, // always try; will fail gracefully if no oauth token either
  });
}
