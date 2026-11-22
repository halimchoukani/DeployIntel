"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  leaveProject,
  getProjectInvitations,
  revokeInvitation,
  type InviteMemberPayload,
  type UpdateMemberRolePayload,
} from "@/lib/api/members";

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
    staleTime: 10 * 1000,
  });
}

export function useProjectInvitations(projectId: string) {
  return useQuery({
    queryKey: ["project-invitations", projectId],
    queryFn: () => getProjectInvitations(projectId),
    enabled: !!projectId,
    staleTime: 15 * 1000,
  });
}

export function useInviteMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => inviteMember(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-invitations", projectId] });
    },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: UpdateMemberRolePayload;
    }) => updateMemberRole(projectId, memberId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });
}

export function useLeaveProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });
}

export function useRevokeInvitation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(projectId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-invitations", projectId] });
    },
  });
}
