"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderGit2, ShieldCheck, RefreshCw } from "lucide-react";

interface AdminHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminHeader({ onRefresh, isRefreshing }: AdminHeaderProps) {
  const pathname = usePathname();

  const navTabs = [
    {
      label: "Platform Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      label: "Project Management",
      href: "/admin/projects",
      icon: FolderGit2,
      active: pathname.startsWith("/admin/projects"),
    },
  ];

  return (
    <div className="bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Top bar info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-[#5850ec] border border-indigo-100">
                <ShieldCheck className="w-3 h-3" />
                Root Authority
              </span>
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-medium text-zinc-500">Administration Console</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Global platform telemetry, user role orchestration, and repository governance.
            </p>
          </div>

          {onRefresh && (
            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isRefreshing ? "animate-spin text-[#5850ec]" : ""}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-t border-zinc-100 pt-2 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all relative border-b-2 -mb-[1px] ${
                  tab.active
                    ? "border-[#5850ec] text-[#5850ec] bg-indigo-50/40"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.active ? "text-[#5850ec]" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
