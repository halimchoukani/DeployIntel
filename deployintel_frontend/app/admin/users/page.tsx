"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Clock,
  Eye,
  Loader2,
  MoreVertical,
  UserCheck,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { GithubIcon } from "@/components/admin/icons";
import { UserDetailsModal } from "@/components/admin/user-details-modal";
import {
  useAdminUsers,
  useBlockUser,
  useActivateUser,
  useUpdateUserRole,
} from "@/hooks/use-admin";
import type { AdminUser, UserRole, UserStatus } from "@/types/admin";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminUsers({
    search,
    status: statusFilter,
    role: roleFilter,
  });

  const blockMutation = useBlockUser();
  const activateMutation = useActivateUser();
  const roleMutation = useUpdateUserRole();

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      blocked: users.filter((u) => u.status === "BLOCKED").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
    };
  }, [users]);

  const handleToggleBlock = async (user: AdminUser) => {
    try {
      if (user.status === "BLOCKED") {
        await activateMutation.mutateAsync(user.id);
      } else {
        await blockMutation.mutateAsync(user.id);
      }
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const nextRole: UserRole = user.role === "ADMIN" ? "DEVELOPER" : "ADMIN";
    try {
      await roleMutation.mutateAsync({ userId: user.id, role: nextRole });
    } catch (err) {
      console.error("Failed to toggle role:", err);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <AdminHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* KPI mini-counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Total Filtered</span>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-600">Active</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-rose-600">Blocked</span>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{stats.blocked}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#5850ec]">Administrators</span>
            <p className="text-xl font-bold text-[#5850ec] mt-0.5">{stats.admins}</p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name or email address..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#5850ec] focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
              className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-medium focus:outline-none focus:border-[#5850ec]"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="DEVELOPER">Developers</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | "")}
              className="text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-medium focus:outline-none focus:border-[#5850ec]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            {(search || statusFilter || roleFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setRoleFilter("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#5850ec] mx-auto mb-3" />
              <p className="text-xs font-semibold text-zinc-600">Loading user directory...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-xs font-semibold text-zinc-800">Failed to fetch users</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-xs text-[#5850ec] font-semibold underline"
              >
                Try again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800">No users found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                No user accounts matched the search criteria or applied filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Projects</th>
                    <th className="py-3 px-4">Member Since</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => {
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Unnamed";
                    const initials =
                      (u.firstName?.[0] || "" + (u.lastName?.[0] || "")).toUpperCase() ||
                      u.email[0].toUpperCase();

                    return (
                      <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-[#5850ec] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-900 truncate max-w-[140px] sm:max-w-[200px]">
                                  {fullName}
                                </span>
                                {u.githubConnected && (
                                  <span
                                    title="GitHub Connected"
                                    className="text-zinc-400 hover:text-zinc-700"
                                  >
                                    <GithubIcon className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[180px] sm:max-w-[220px]">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            disabled={roleMutation.isPending}
                            title="Click to toggle between ADMIN and DEVELOPER"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              u.role === "ADMIN"
                                ? "bg-indigo-50 text-[#5850ec] border-indigo-200 hover:bg-indigo-100"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200"
                            }`}
                          >
                            {u.role === "ADMIN" ? (
                              <ShieldAlert className="w-3 h-3" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            {u.role}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {u.status === "ACTIVE" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Active
                            </span>
                          )}
                          {u.status === "BLOCKED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3 text-rose-500" />
                              Blocked
                            </span>
                          )}
                          {u.status === "INACTIVE" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Projects */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700">
                            {u.projectCount}
                          </span>
                        </td>

                        {/* Member Since */}
                        <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectUser(u)}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors shadow-2xs"
                              title="Inspect full user profile and permissions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              disabled={blockMutation.isPending || activateMutation.isPending}
                              className={`p-1.5 rounded-lg border text-xs transition-colors shadow-2xs ${
                                u.status === "BLOCKED"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                              title={u.status === "BLOCKED" ? "Activate User" : "Block User"}
                            >
                              {u.status === "BLOCKED" ? (
                                <UserCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inspect User Modal */}
      {inspectUser && (
        <UserDetailsModal
          user={inspectUser}
          onClose={() => setInspectUser(null)}
        />
      )}
    </div>
  );
}

