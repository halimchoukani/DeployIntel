"use client";

import React from "react";
import { useAuthUser } from "@/hooks/use-auth-user";

export function DashboardTopbar() {
  const { data: user } = useAuthUser();

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
        <span className="text-zinc-400">Projects</span>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-semibold tracking-tight">Platform Infrastructure</span>
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
            ⌘K
          </kbd>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-zinc-200" />

        {/* Theme toggle */}
        <button className="w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">1</span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="text-xs font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors truncate max-w-[120px]">
            {displayName}
          </span>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 shrink-0">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </header>
  );
}

