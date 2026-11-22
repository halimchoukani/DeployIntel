"use client";

import React, { useState } from "react";
import type { Project } from "@/lib/api/project";
import {
  useProjectMembers,
  useProjectInvitations,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useRevokeInvitation,
} from "@/hooks/use-members";
import { useAuthUser } from "@/hooks/use-auth-user";
import type {
  ProjectMember,
  ProjectRole,
  ProjectPermission,
  ProjectInvitation,
} from "@/lib/api/members";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Info,
  MoreVertical,
  KeyRound,
  ExternalLink,
  Crown,
} from "lucide-react";

interface MembersTabProps {
  project: Project;
}

const ROLE_DEFINITIONS: Record<
  ProjectRole,
  { label: string; description: string; badgeClass: string; permissions: string[] }
> = {
  OWNER: {
    label: "Owner",
    description: "Unrestricted control over project configuration, environments, billing, team members, and deletion.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    permissions: [
      "View project & test history",
      "Trigger gate checks & security scans",
      "Manage releases & rollback versions",
      "Manage test environments & sync repos",
      "Invite & manage team member roles",
      "Configure project settings & CI/CD tokens",
      "Delete or archive project",
    ],
  },
  MAINTAINER: {
    label: "Maintainer",
    description: "Can manage releases, test environments, trigger automated gates, and invite or update team members.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    permissions: [
      "View project & test history",
      "Trigger gate checks & security scans",
      "Manage releases & rollback versions",
      "Manage test environments & sync repos",
      "Invite & manage team member roles",
      "Configure project settings & CI/CD tokens",
    ],
  },
  DEVELOPER: {
    label: "Developer",
    description: "Can create releases, run gate checks, view test executions, and inspect test environments.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    permissions: [
      "View project & test history",
      "Trigger gate checks & security scans",
      "Manage releases",
      "View test environments",
    ],
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access to view project dashboards, releases, logs, and automated gate check results.",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    permissions: [
      "View project & test history",
      "Inspect release details & AI suggestions",
    ],
  },
};

export function MembersTab({ project }: MembersTabProps) {
  const { data: currentUser } = useAuthUser();
  const { data: members, isLoading: isLoadingMembers, refetch: refetchMembers } = useProjectMembers(project.id);
  const { data: invitations, isLoading: isLoadingInvitations, refetch: refetchInvitations } = useProjectInvitations(project.id);

  const inviteMemberMutation = useInviteMember(project.id);
  const updateRoleMutation = useUpdateMemberRole(project.id);
  const removeMemberMutation = useRemoveMember(project.id);
  const revokeInvitationMutation = useRevokeInvitation(project.id);

  // Modals & form state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("DEVELOPER");
  const [inviteFeedback, setInviteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [roleChangeTarget, setRoleChangeTarget] = useState<ProjectMember | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<ProjectRole>("DEVELOPER");

  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Compute permissions for current user in this project
  const currentMember = members?.find((m) => m.userId === currentUser?.id || m.email.toLowerCase() === currentUser?.email.toLowerCase());
  const isOwner = project.ownerId === currentUser?.id || currentMember?.role === "OWNER" || currentUser?.role === "ADMIN";
  // Prefer project-scoped role from API response (more accurate than inferring from member list)
  const effectiveRole = project.currentUserRole ?? currentMember?.role;
  const canManageMembers =
    effectiveRole === "OWNER" ||
    effectiveRole === "MAINTAINER" ||
    currentMember?.permissions?.includes("MANAGE_MEMBERS") ||
    currentUser?.role === "ADMIN";

  const totalMembers = members?.length || 0;
  const totalInvitations = invitations?.length || 0;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteFeedback(null);
    try {
      await inviteMemberMutation.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteFeedback({
        type: "success",
        message: `Member ${inviteEmail.trim()} successfully added or invited as ${inviteRole}!`,
      });
      setInviteEmail("");
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteFeedback(null);
      }, 1400);
    } catch (err: any) {
      setInviteFeedback({
        type: "error",
        message: err.message || "Failed to invite member. Please check the email and try again.",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!roleChangeTarget) return;
    try {
      await updateRoleMutation.mutateAsync({
        memberId: roleChangeTarget.id,
        payload: { role: selectedNewRole },
      });
      setRoleChangeTarget(null);
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMemberMutation.mutateAsync(memberToRemove.id);
      setMemberToRemove(null);
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this pending invitation?")) return;
    try {
      await revokeInvitationMutation.mutateAsync(invitationId);
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Overview & Quick Actions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Project Team & Collaboration
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {totalMembers} {totalMembers === 1 ? "Member" : "Members"}
              </span>
              {totalInvitations > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {totalInvitations} Pending
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage collaborators, assign role-based access control (RBAC), and invite team members to this repository.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              {showPermissionsMatrix ? "Hide Permissions Matrix" : "Role Permissions Matrix"}
            </button>

            {canManageMembers && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Roles Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          {(["OWNER", "MAINTAINER", "DEVELOPER", "VIEWER"] as ProjectRole[]).map((role) => {
            const count = members?.filter((m) => m.role === role).length || 0;
            const def = ROLE_DEFINITIONS[role];
            return (
              <div
                key={role}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50"
              >
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {def.label}s
                  </div>
                  <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {count}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${def.badgeClass}`}>
                  {role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Drawer/Card */}
      {showPermissionsMatrix && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Role & Permissions Reference Matrix
              </h3>
            </div>
            <button
              onClick={() => setShowPermissionsMatrix(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Capability / Permission</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Viewer</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Developer</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Maintainer</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { name: "View Project, Commits & Releases", v: true, d: true, m: true, o: true },
                  { name: "Inspect Test History & AI Diagnostic Logs", v: true, d: true, m: true, o: true },
                  { name: "Trigger Automated Gates (Semgrep, k6, Risk)", v: false, d: true, m: true, o: true },
                  { name: "Create & Tag New Releases", v: false, d: true, m: true, o: true },
                  { name: "Start/Stop Docker Test Environments", v: false, d: false, m: true, o: true },
                  { name: "Sync Git Repository Workspace Code", v: false, d: false, m: true, o: true },
                  { name: "Invite & Manage Collaborator Roles", v: false, d: false, m: true, o: true },
                  { name: "Generate CI/CD Automation Tokens", v: false, d: false, m: true, o: true },
                  { name: "Project Danger Zone (Archive & Delete)", v: false, d: false, m: false, o: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-2 px-4 font-medium text-zinc-800 dark:text-zinc-200">{row.name}</td>
                    <td className="py-2 px-3 text-center">{row.v ? "✅" : "—"}</td>
                    <td className="py-2 px-3 text-center">{row.d ? "✅" : "—"}</td>
                    <td className="py-2 px-3 text-center">{row.m ? "✅" : "—"}</td>
                    <td className="py-2 px-3 text-center">{row.o ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Members Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Active Project Members ({totalMembers})
            </h3>
          </div>
        </div>

        {isLoadingMembers ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-500">Loading project members…</span>
          </div>
        ) : !members || members.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            No members found for this project.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/75 dark:bg-zinc-800/50 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Permissions</th>
                  <th className="py-3 px-6">Joined Date</th>
                  {canManageMembers && <th className="py-3 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {members.map((member) => {
                  const isCurrent = member.userId === currentUser?.id || member.email.toLowerCase() === currentUser?.email.toLowerCase();
                  const roleDef = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.DEVELOPER;
                  const initials = (member.fullName || member.email)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName || member.email}
                              className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                              <span>{member.fullName || member.email.split("@")[0]}</span>
                              {member.isOwner && (
                                <span title="Project Owner">
                                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleDef.badgeClass}`}>
                          {roleDef.label}
                        </span>
                      </td>

                      {/* Permissions Granted Preview */}
                      <td className="py-3.5 px-6">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {member.permissions?.slice(0, 3).map((perm) => (
                            <span
                              key={perm}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            >
                              {perm.replace("_", " ").toLowerCase()}
                            </span>
                          ))}
                          {member.permissions && member.permissions.length > 3 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                              title={member.permissions.join(", ")}
                            >
                              +{member.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-6 text-zinc-500 dark:text-zinc-400">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "Existing"}
                      </td>

                      {/* Actions */}
                      {canManageMembers && (
                        <td className="py-3.5 px-6 text-right">
                          {member.isOwner ? (
                            <span className="text-[11px] text-zinc-400 italic">Primary Owner</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setRoleChangeTarget(member);
                                  setSelectedNewRole(member.role);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition"
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => setMemberToRemove(member)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded transition"
                                title="Remove Member"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations Card */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pending Invitations ({invitations.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/75 dark:bg-zinc-800/50 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-6">Invited Email</th>
                  <th className="py-3 px-6">Proposed Role</th>
                  <th className="py-3 px-6">Invited By</th>
                  <th className="py-3 px-6">Sent Date</th>
                  <th className="py-3 px-6">Expires</th>
                  {canManageMembers && <th className="py-3 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="py-3.5 px-6 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-zinc-400" />
                        {inv.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_DEFINITIONS[inv.role]?.badgeClass || ""}`}>
                        {inv.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-zinc-500 dark:text-zinc-400">
                      {inv.invitedByEmail || "Project Team"}
                    </td>
                    <td className="py-3.5 px-6 text-zinc-500 dark:text-zinc-400">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-6 text-zinc-500 dark:text-zinc-400">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "7 days"}
                    </td>
                    {canManageMembers && (
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded transition"
                        >
                          Revoke
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: Invite New Member --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Invite Collaborator
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add a colleague to <span className="font-medium text-zinc-800 dark:text-zinc-200">{project.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteFeedback(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  inviteFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800"
                }`}
              >
                {inviteFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{inviteFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  If the user already has a DeployIntel account, they will be granted immediate access. Otherwise, a pending invitation is issued.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Assign Project Role
                </label>
                <div className="space-y-2">
                  {(["MAINTAINER", "DEVELOPER", "VIEWER"] as ProjectRole[]).map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const isSelected = inviteRole === r;
                    return (
                      <div
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {def.label}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${def.badgeClass}`}>
                            {r}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          {def.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMemberMutation.isPending || !inviteEmail.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg transition shadow-xs"
                >
                  {inviteMemberMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending Invite…
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Change Member Role --- */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Change Member Role
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Updating role for {roleChangeTarget.fullName || roleChangeTarget.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRoleChangeTarget(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {(["MAINTAINER", "DEVELOPER", "VIEWER"] as ProjectRole[]).map((r) => {
                const def = ROLE_DEFINITIONS[r];
                const isSelected = selectedNewRole === r;
                return (
                  <div
                    key={r}
                    onClick={() => setSelectedNewRole(r)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {def.label}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${def.badgeClass}`}>
                        {r}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending || selectedNewRole === roleChangeTarget.role}
                className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg transition shadow-xs"
              >
                {updateRoleMutation.isPending ? "Saving Role…" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Remove Member Confirmation --- */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Remove Collaborator
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Revoke project access for {memberToRemove.fullName || memberToRemove.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Are you sure you want to remove <span className="font-semibold">{memberToRemove.email}</span> from this project?
              They will immediately lose access to test environments, CI/CD telemetry, and releases.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={removeMemberMutation.isPending}
                className="px-5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-lg transition shadow-xs"
              >
                {removeMemberMutation.isPending ? "Removing…" : "Yes, Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
