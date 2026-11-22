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

  const barColors = {
    1: "bg-destructive",
    2: "bg-warning",
    3: "bg-success",
  };

  return (
    <div className="rounded-xl border border-card-border bg-muted/30 p-3 sm:p-3.5 transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          PASSWORD STRENGTH
        </span>
        <span
          className={`text-xs font-semibold transition-colors duration-200 ${
            hasPasswordInput ? strength.colorClass : "text-muted-foreground"
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
                isActive ? barColors[barIndex as keyof typeof barColors] : "bg-muted"
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
              ? "text-success"
              : "text-muted-foreground"
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-colors ${
              criteria.hasMinLength || !hasPasswordInput
                ? "text-success"
                : "text-muted-foreground"
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
              ? "text-success"
              : "text-muted-foreground"
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-colors ${
              criteria.hasUppercase || !hasPasswordInput
                ? "text-success"
                : "text-muted-foreground"
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
              ? "text-success"
              : "text-muted-foreground"
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-colors ${
              criteria.hasNumberAndSymbol || !hasPasswordInput
                ? "text-success"
                : "text-muted-foreground"
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