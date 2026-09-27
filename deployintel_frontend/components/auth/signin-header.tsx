import React from "react";

interface SigninHeaderProps {
  version?: string;
  title?: string;
  subtitle?: string;
}

export function SigninHeader({
  version = "v2.4",
  title = "Welcome back",
  subtitle = "Sign in to continue managing your deployments.",
}: SigninHeaderProps) {
  return (
    <div className="w-full">
      {/* Brand row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b0f19] text-white shadow-sm ring-1 ring-white/10">
            <svg
              className="h-4 w-4 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" className="opacity-40" />
              <path d="M12 16V8" />
              <path d="m8 12 4-4 4 4" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
            DeployIntel
          </span>
        </div>
        <span className="rounded-md border border-zinc-200/80 bg-zinc-100/80 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-500">
          {version}
        </span>
      </div>

      {/* Title */}
      <div className="mt-6">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-1 text-[13.5px] sm:text-sm text-zinc-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
