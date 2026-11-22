"use client";

import React from "react";
import Link from "next/link";
import { useSigninForm } from "@/hooks/use-signin-form";

interface SigninFormProps {
  onSuccess?: () => void;
}

export function SigninForm({ onSuccess }: SigninFormProps) {
  const {
    values,
    showPassword,
    fieldErrors,
    generalError,
    successMessage,
    isSubmitting,
    isSuccess,
    handleChange,
    toggleShowPassword,
    handleSubmit,
  } = useSigninForm(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {/* General Error */}
      {generalError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30 flex items-start gap-2">
          <svg
            className="h-4 w-4 text-destructive shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="rounded-lg bg-success/10 p-3 text-xs text-success border border-success/20 dark:bg-success/20 dark:border-success/30 flex items-start gap-2">
          <svg
            className="h-4 w-4 text-success shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Work Email */}
      <div>
        <label
          htmlFor="signin-email"
          className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
        >
          WORK EMAIL
        </label>
        <input
          id="signin-email"
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="alex@company.com"
          autoComplete="email"
          className={`w-full h-10 rounded-lg border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none transition-all ${
            fieldErrors.email
              ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
              : "border-card-border focus:border-ring focus:ring-2 focus:ring-ring/15"
          }`}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-[11px] text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="signin-password"
          className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
        >
          PASSWORD
        </label>
        <div className="relative">
          <input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className={`w-full h-10 rounded-lg border bg-muted/40 pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none transition-all ${
              fieldErrors.password
                ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                : "border-card-border focus:border-ring focus:ring-2 focus:ring-ring/15"
            }`}
          />
          <button
            type="button"
            onClick={toggleShowPassword}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
          >
            {showPassword ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-[11px] text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      {/* Remember me + Forgot password row */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.rememberMe}
            onChange={(e) => handleChange("rememberMe", e.target.checked)}
            className="h-4 w-4 rounded border-input-border text-ring focus:ring-ring/20 cursor-pointer accent-ring"
          />
          <span className="text-xs text-muted-foreground">Remember me for 30 days</span>
        </label>

        <Link
          href="/forgot-password"
          className="text-xs font-medium text-ring hover:text-ring hover:underline transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isSuccess}
        className="w-full h-11 bg-accent hover:bg-accent-hover active:bg-accent-hover/90 disabled:opacity-70 disabled:cursor-not-allowed text-accent-foreground text-sm font-medium rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
      >
        {isSubmitting ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-accent-foreground"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}