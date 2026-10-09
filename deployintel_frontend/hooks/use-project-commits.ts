"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProjectCommits, type ProjectCommit } from "@/lib/api/commits";

export function useProjectCommits(
  projectName?: string,
  repositoryUrl?: string,
  defaultBranch = "main"
) {
  return useQuery<ProjectCommit[]>({
    queryKey: ["project_commits", projectName, repositoryUrl, defaultBranch],
    queryFn: () => {
      if (!projectName || !repositoryUrl) {
        return Promise.resolve([]);
      }
      return fetchProjectCommits(projectName, repositoryUrl, defaultBranch);
    },
    enabled: !!projectName && !!repositoryUrl,
    staleTime: 60 * 1000,
  });
}
