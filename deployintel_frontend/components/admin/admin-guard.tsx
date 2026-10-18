"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Loader2, Lock } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data: user, isLoading, isError } = useAuthUser();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5850ec] shadow-sm mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-zinc-700">Verifying administrator privileges...</p>
        <p className="text-xs text-zinc-400 mt-1">Checking system permissions and authorization</p>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  if (isError || !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 mb-2">
            <Lock className="w-3 h-3" />
            Restricted Zone
          </span>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Administrator Access Required
          </h2>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            This administration console is restricted to platform administrators. Your account is
            currently assigned the{" "}
            <span className="font-semibold text-zinc-700 font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
              {user?.role || "GUEST"}
            </span>{" "}
            role.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5850ec] hover:bg-[#4a42db] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
