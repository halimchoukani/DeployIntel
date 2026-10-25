"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEnvironmentsForProject,
  getEnvironmentById,
  createEnvironment,
  startEnvironment,
  stopEnvironment,
  deleteEnvironment,
  getEnvironmentLogs,
  executeCommand,
  getDockerDaemonStatus,
  type CreateEnvironmentPayload,
  type ExecuteCommandPayload,
} from "@/lib/api/environments";

export function useEnvironments(projectId: string) {
  return useQuery({
    queryKey: ["environments", projectId],
    queryFn: () => getEnvironmentsForProject(projectId),
    enabled: !!projectId,
    retry: false,
    staleTime: 5000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      // Auto-poll if any container is in transition
      const hasActiveTransition = data.some(
        (env) => env.status === "STARTING" || env.status === "PENDING"
      );
      return hasActiveTransition ? 3000 : 15000;
    },
  });
}

export function useEnvironment(projectId: string, environmentId: string) {
  return useQuery({
    queryKey: ["environment", projectId, environmentId],
    queryFn: () => getEnvironmentById(projectId, environmentId),
    enabled: !!projectId && !!environmentId,
    retry: false,
  });
}

export function useDockerDaemonStatus() {
  return useQuery({
    queryKey: ["docker-status"],
    queryFn: getDockerDaemonStatus,
    retry: false,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useCreateEnvironment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEnvironmentPayload) =>
      createEnvironment(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments", projectId] });
    },
  });
}

export function useStartEnvironment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (environmentId: string) =>
      startEnvironment(projectId, environmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments", projectId] });
    },
  });
}

export function useStopEnvironment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (environmentId: string) =>
      stopEnvironment(projectId, environmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments", projectId] });
    },
  });
}

export function useDeleteEnvironment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (environmentId: string) =>
      deleteEnvironment(projectId, environmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments", projectId] });
    },
  });
}

export function useEnvironmentLogs(
  projectId: string,
  environmentId: string | null,
  tail: number = 100,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["environment-logs", projectId, environmentId, tail],
    queryFn: () => getEnvironmentLogs(projectId, environmentId!, tail),
    enabled: !!projectId && !!environmentId && enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}

export function useExecuteCommand(projectId: string, environmentId: string) {
  return useMutation({
    mutationFn: (payload: ExecuteCommandPayload) =>
      executeCommand(projectId, environmentId, payload),
  });
}