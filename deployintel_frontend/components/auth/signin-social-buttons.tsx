"use client";

import React from "react";
import { useGithubAuth } from "@/hooks/use-github-auth";

interface SigninSocialButtonsProps {
  onGoogleClick?: () => void;
}

export function SigninSocialButtons({ onGoogleClick }: SigninSocialButtonsProps) {
  const { initiateGithubLogin, isRedirecting, error } = useGithubAuth();

  const handleGoogle = () => {
    if (onGoogleClick) {
      onGoogleClick();
    } else {
      console.log("Google OAuth clicked");
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200/80 p-2.5 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* Continue with GitHub */}
        <button
          type="button"
          onClick={initiateGithubLogin}
          disabled={isRedirecting}
          className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-4 text-xs sm:text-sm font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {isRedirecting ? (
            <svg
              className="h-4 w-4 animate-spin text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 fill-current text-zinc-900"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span>{isRedirecting ? "Redirecting…" : "Continue with Gi…"}</span>
        </button>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-4 text-xs sm:text-sm font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}
