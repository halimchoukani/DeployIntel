import React from "react";
import { PasswordStrengthResult } from "@/types/auth";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrengthResult;
  hasPasswordInput: boolean;
}

export function PasswordStrengthIndicator({
  strength,
  hasPasswordInput,
}: PasswordStrengthIndicatorProps) {
  const { score, label, criteria } = strength;

  return (
    <div className="rounded-xl border border-zinc-100 bg-[#f9fafb] p-3 sm:p-3.5 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          PASSWORD STRENGTH
        </span>
        <span
          className={`text-xs font-semibold transition-colors duration-200 ${
            hasPasswordInput ? strength.colorClass : "text-zinc-400"
          }`}
        >
          {hasPasswordInput ? label : "Strong"}
        </span>
      </div>

      {/* 3 Progress Bars */}
      <div className="my-2.5 flex items-center gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((barIndex) => {
          const isActive = hasPasswordInput ? score >= barIndex : barIndex <= 3; // default active in mock/preview or dynamic
          return (
            <div
              key={barIndex}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                isActive ? "bg-[#5850ec]" : "bg-zinc-200"
              }`}
            />
          );
        })}
      </div>

      {/* Requirements Criteria Badges */}
      <div className="flex flex-wrap items-center justify-between gap-y-1 text-[11px] sm:text-xs">
        {/* 8+ characters */}
        <div
          className={`flex items-center gap-1 transition-colors duration-200 ${
            criteria.hasMinLength || !hasPasswordInput
              ? "text-zinc-600"
              : "text-zinc-400"
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-colors ${
              criteria.hasMinLength || !hasPasswordInput
                ? "text-[#5850ec]"
                : "text-zinc-400"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>8+ characters</span>
        </div>

        {/* 1 uppercase */}
        <div
          className={`flex items-center gap-1 transition-colors duration-200 ${
            criteria.hasUppercase || !hasPasswordInput
              ? "text-zinc-600"
              : "text-zinc-400"
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-colors ${
              criteria.hasUppercase || !hasPasswordInput
                ? "text-[#5850ec]"
                : "text-zinc-400"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>1 uppercase</span>
        </div>

        {/* Number & symbol */}
        <div
          className={`flex items-center gap-1 transition-colors duration-200 ${
            criteria.hasNumberAndSymbol || !hasPasswordInput
              ? "text-zinc-600"
              : "text-zinc-400"
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-colors ${
              criteria.hasNumberAndSymbol || !hasPasswordInput
                ? "text-[#5850ec]"
                : "text-zinc-400"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          <span>Number & symbol</span>
        </div>
      </div>
    </div>
  );
}
