import React from "react";

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = "OR SIGN UP WITH EMAIL" }: AuthDividerProps) {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-card-border" />
      </div>
      <div className="relative flex justify-center bg-card px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}