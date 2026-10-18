"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";

export function DashboardTopbar() {
  const pathname = usePathname();
  const { data: user } = useAuthUser();
  const isAdminRoute = pathname?.startsWith("/admin");

  // Compute display name and initials
  let displayName = "Loading...";
  let initials = "--";

  if (user) {
    if (user.firstName || user.lastName) {
      displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
    } else {
      // Fallback to email prefix (e.g. alex@company.com -> Alex)
      const prefix = user.email.split("@")[0];
      displayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      initials = prefix.substring(0, 2).toUpperCase();
    }
  }

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 z-20">
      {/* Breadcrumbs (Left) */}
      <div className="flex items-center gap-2 text-sm">
        {isAdminRoute ? (
          <>
            <span className="text-zinc-400 font-medium">Administration</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900 font-semibold tracking-tight">
              {pathname === "/admin"
                ? "Platform Overview"
                : pathname.startsWith("/admin/users")
                ? "User Management"
                : pathname.startsWith("/admin/projects")
                ? "Project Management"
                : "Console"}
            </span>
          </>
        ) : (
          <>
            <span className="text-zinc-400">Projects</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900 font-semibold tracking-tight">Platform Infrastructure</span>
          </>
        )}
      </div>

      {/* Right side (Search + Actions + Avatar) */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search deployments, risks..."
            className="w-full h-8 pl-8 pr-10 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-[#5850ec] focus:ring-1 focus:ring-[#5850ec]/20 transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1 py-0.5 rounded">
            ?K
          </kbd>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-zinc-200" />

        {/* User avatar and role badge */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden shadow-2xs">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors truncate max-w-[120px]">
              {displayName}
            </span>
            {user?.role === "ADMIN" && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-[#5850ec] border border-indigo-200">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
