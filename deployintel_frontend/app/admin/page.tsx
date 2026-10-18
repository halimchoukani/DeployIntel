"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  TrendingUp,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Award,
  ArrowRight,
  Code2,
  CheckCircle2,
  Ban,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAdminKpis } from "@/hooks/use-admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { GithubIcon } from "@/components/admin/icons";

export default function AdminOverviewPage() {
  const { data: kpiData, isLoading, isError, refetch, isFetching } = useAdminKpis();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-zinc-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-72 bg-white rounded-2xl border border-zinc-200 lg:col-span-2" />
            <div className="h-72 bg-white rounded-2xl border border-zinc-200" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !kpiData) {
    return (
      <div className="min-h-screen">
        <AdminHeader onRefresh={() => refetch()} isRefreshing={isFetching} />
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">Failed to load platform analytics</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            The admin KPI metrics could not be retrieved from the server.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-[#5850ec] text-white text-xs font-semibold shadow-xs hover:bg-[#4941db] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { userKpis, projectKpis, overview, topContributors } = kpiData;

  // Language breakdown sorted by count
  const languages = Object.entries(projectKpis.projectsByLanguage || {}).sort(
    ([, a], [, b]) => b - a
  );
  const totalLanguageProjects = languages.reduce((acc, [, val]) => acc + val, 0) || 1;

  return (
    <div className="min-h-screen pb-16">
      <AdminHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Top 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Users */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Total Accounts
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850ec]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {userKpis.totalUsers}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                  +{userKpis.newUsersLast7Days} this week
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>{userKpis.activeUsers} active users</span>
              <span className="font-semibold text-zinc-700">
                {(overview.activeUsersRate * 100).toFixed(0)}% engagement
              </span>
            </div>
          </div>

          {/* 2. Total Projects */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Total Repositories
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {projectKpis.totalProjects}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                  +{projectKpis.newProjectsLast7Days} this week
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>{projectKpis.activeProjects} active projects</span>
              <span className="font-semibold text-zinc-700">
                {(overview.activeProjectsRate * 100).toFixed(0)}% active
              </span>
            </div>
          </div>

          {/* 3. Platform Growth Velocity */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  30-Day Velocity
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                  +{userKpis.newUsersLast30Days}
                </span>
                <span className="text-xs font-semibold text-zinc-500">new users (30d)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>+{projectKpis.newProjectsLast30Days} projects created</span>
              <span className="font-semibold text-emerald-600">Growing</span>
            </div>
          </div>

          {/* 4. Density / Ratio */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Projects / Developer
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {projectKpis.averageProjectsPerUser.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-zinc-400">avg per user</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>{userKpis.adminUsers} administrators</span>
              <span className="font-semibold text-zinc-700">{userKpis.developerUsers} devs</span>
            </div>
          </div>
        </div>

        {/* Section: Middle Grid (User Breakdown & Language Ecosystem) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Composition Panel */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5850ec]" />
                User Account Composition
              </h2>
              <Link
                href="/admin/users"
                className="text-[11px] font-semibold text-[#5850ec] hover:underline flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {/* Active / Inactive / Blocked */}
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Active Accounts
                  </span>
                  <span className="font-bold text-zinc-800">{userKpis.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Inactive Accounts
                  </span>
                  <span className="font-bold text-zinc-800">{userKpis.inactiveUsers}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                    Blocked Accounts
                  </span>
                  <span className="font-bold text-rose-700">{userKpis.blockedUsers}</span>
                </div>
              </div>

              {/* Roles & Auth Distribution */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                    GitHub OAuth
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800">{userKpis.githubConnectedUsers}</span>
                    <GithubIcon className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">
                    Local Email
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800">{userKpis.localUsers}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Languages Breakdown Panel */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                Repository Language Ecosystem
              </h2>
              <Link
                href="/admin/projects"
                className="text-[11px] font-semibold text-[#5850ec] hover:underline flex items-center gap-1"
              >
                Inspect All Projects <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {languages.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                No language telemetry recorded yet
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {languages.map(([language, count]) => {
                  const percentage = Math.round((count / totalLanguageProjects) * 100);
                  return (
                    <div key={language} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-700">{language || "Unspecified"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400">{count} repo{count > 1 ? "s" : ""}</span>
                          <span className="font-mono text-zinc-600 font-bold">{percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5850ec] to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section: Top Platform Contributors */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Platform Contributors
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Users maintaining the highest volume of projects and pipelines across DeployIntel.
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-[#5850ec] hover:underline flex items-center gap-1"
            >
              View Full Directory <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {topContributors.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
              No contributor records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5">Contributor</th>
                    <th className="pb-2.5">Email</th>
                    <th className="pb-2.5 text-right">Projects Owned</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {topContributors.map((c, index) => {
                    const initials = (c.name || c.email).substring(0, 2).toUpperCase();
                    return (
                      <tr key={c.userId} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 flex items-center gap-2.5">
                          <span className="w-5 text-[11px] font-bold text-zinc-400 text-center">
                            #{index + 1}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850ec] font-bold text-[11px]">
                            {initials}
                          </div>
                          <span className="font-semibold text-zinc-900">{c.name || "Unnamed"}</span>
                        </td>
                        <td className="py-3 text-zinc-500 font-mono text-[11px]">{c.email}</td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#5850ec] border border-indigo-100">
                            {c.projectCount} projects
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/projects?ownerId=${c.userId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-[#5850ec]"
                          >
                            <span>Filter Repos</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
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
    </div>
  );
}

