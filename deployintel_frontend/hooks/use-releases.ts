"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReleasesForProject,
  getReleaseById,
  createRelease,
  type CreateReleasePayload,
} from "@/lib/api/releases";

export function useReleases(projectId: string) {
  return useQuery({
    queryKey: ["releases", projectId],
    queryFn: () => getReleasesForProject(projectId),
    enabled: !!projectId,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useRelease(releaseId: string) {
  return useQuery({
    queryKey: ["release", releaseId],
    queryFn: () => getReleaseById(releaseId),
    enabled: !!releaseId,
    retry: false,
  });
}

export function useCreateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReleasePayload) => createRelease(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["releases", data.projectId] });
    },
  });
}
