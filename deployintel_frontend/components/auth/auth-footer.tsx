import React from "react";
import Link from "next/link";

interface AuthFooterProps {
  loginHref?: string;
}

export function AuthFooter({ loginHref = "/login" }: AuthFooterProps) {
  return (
    <div className="mt-5 space-y-4 text-center">
      {/* Sign in switch */}
      <p className="text-xs sm:text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-ring hover:text-ring hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>

      {/* Enterprise security notice */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <svg
          className="h-3.5 w-3.5 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>Protected by enterprise SSO & WebAuthn</span>
      </div>
    </div>
  );
}