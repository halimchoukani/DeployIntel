"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  FolderGit2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Clock,
  Loader2,
} from "lucide-react";
import type { AdminUser, UserRole, UserStatus } from "@/types/admin";
import { useUpdateUserRole, useUpdateUserStatus } from "@/hooks/use-admin";
import { GithubIcon } from "@/components/admin/icons";

interface UserDetailsModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null);

  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();

  if (!user) return null;

  const currentRole = selectedRole || user.role;
  const currentStatus = selectedStatus || user.status;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed User";
  const initials = (user.firstName?.[0] || "" + (user.lastName?.[0] || "")).toUpperCase() || user.email[0].toUpperCase();

  const handleRoleChange = async (newRole: UserRole) => {
    setSelectedRole(newRole);
    try {
      await updateRoleMutation.mutateAsync({ userId: user.id, role: newRole });
    } catch (err) {
      console.error(err);
      setSelectedRole(user.role);
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    setSelectedStatus(newStatus);
    try {
      await updateStatusMutation.mutateAsync({ userId: user.id, status: newStatus });
    } catch (err) {
      console.error(err);
      setSelectedStatus(user.status);
    }
  };

  const isSaving = updateRoleMutation.isPending || updateStatusMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 pt-6 pb-12 relative text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10">
              User Profile Inspector
            </span>
          </div>
        </div>

        {/* Content with overlapping avatar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-9 mb-4 flex items-end justify-between">
            <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md ring-4 ring-white">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-[#5850ec] flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-1.5">
              {currentStatus === "ACTIVE" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Active
                </span>
              )}
              {currentStatus === "BLOCKED" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Ban className="w-3.5 h-3.5 text-rose-600" />
                  Blocked
                </span>
              )}
              {currentStatus === "INACTIVE" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{fullName}</h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{user.email}</p>
          </div>

          {/* User metadata grid */}
          <div className="grid grid-cols-2 gap-3 my-5">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Projects</span>
              </div>
              <p className="text-base font-bold text-zinc-900">{user.projectCount}</p>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Sync</span>
              </div>
              <p className="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                {user.githubConnected ? (
                  <span className="text-emerald-600 font-medium">Connected</span>
                ) : (
                  <span className="text-zinc-400">Not Linked</span>
                )}
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member Since</span>
              </div>
              <p className="text-xs font-semibold text-zinc-800">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </div>
              <p className="text-xs font-semibold text-zinc-800 truncate">
                {user.phone || "Not provided"}
              </p>
            </div>
          </div>

          {/* Administrative actions */}
          <div className="border-t border-zinc-100 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                User Role Authorization
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleRoleChange("DEVELOPER")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    currentRole === "DEVELOPER"
                      ? "border-indigo-600 bg-indigo-50/50 text-[#5850ec]"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  DEVELOPER
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleRoleChange("ADMIN")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    currentRole === "ADMIN"
                      ? "border-indigo-600 bg-indigo-50/50 text-[#5850ec]"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  ADMIN
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Account Status Control
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleStatusChange("ACTIVE")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    currentStatus === "ACTIVE"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleStatusChange("INACTIVE")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    currentStatus === "INACTIVE"
                      ? "border-zinc-400 bg-zinc-100 text-zinc-800"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Inactive
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleStatusChange("BLOCKED")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    currentStatus === "BLOCKED"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Blocked
                </button>
              </div>
            </div>
          </div>

          {/* Footer action */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

