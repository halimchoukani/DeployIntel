"use client";

import React from "react";
import Link from "next/link";
import { useSignupForm } from "@/hooks/use-signup-form";
import { PasswordStrengthIndicator } from "./password-strength-indicator";

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const {
    values,
    showPassword,
    fieldErrors,
    generalError,
    successMessage,
    passwordStrength,
    isSubmitting,
    isSuccess,
    handleChange,
    toggleShowPassword,
    handleSubmit,
  } = useSignupForm(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {/* General Error Alert */}
      {generalError && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200/80 flex items-start gap-2">
          <svg
            className="h-4 w-4 text-red-500 shrink-0 mt-0.5"
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

      {/* Success Alert */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200/80 flex items-start gap-2">
          <svg
            className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
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

      {/* Row: First Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            FIRST NAME
          </label>
          <input
            id="firstName"
            type="text"
            value={values.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Alex"
            autoComplete="given-name"
            className={`w-full h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
              fieldErrors.firstName
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-zinc-200 focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/15"
            }`}
          />
          {fieldErrors.firstName && (
            <p className="mt-1 text-[11px] text-red-600">
              {fieldErrors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            LAST NAME
          </label>
          <input
            id="lastName"
            type="text"
            value={values.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Martin"
            autoComplete="family-name"
            className={`w-full h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
              fieldErrors.lastName
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-zinc-200 focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/15"
            }`}
          />
          {fieldErrors.lastName && (
            <p className="mt-1 text-[11px] text-red-600">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Work Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
        >
          WORK EMAIL
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="alex.martin@acme-cloud.io"
          autoComplete="email"
          className={`w-full h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
            fieldErrors.email
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-zinc-200 focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/15"
          }`}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-[11px] text-red-600">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password with Eye Toggle */}
      <div>
        <label
          htmlFor="password"
          className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
        >
          PASSWORD
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••••••"
            autoComplete="new-password"
            className={`w-full h-10 rounded-lg border bg-white pl-3 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
              fieldErrors.password
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-zinc-200 focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/15"
            }`}
          />
          <button
            type="button"
            onClick={toggleShowPassword}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
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
          <p className="mt-1 text-[11px] text-red-600">{fieldErrors.password}</p>
        )}
      </div>

      {/* Password Strength Indicator Box */}
      <PasswordStrengthIndicator
        strength={passwordStrength}
        hasPasswordInput={values.password.length > 0}
      />

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
        >
          CONFIRM PASSWORD
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={values.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          placeholder="••••••••••••"
          autoComplete="new-password"
          className={`w-full h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
            fieldErrors.confirmPassword
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-zinc-200 focus:border-[#5850ec] focus:ring-2 focus:ring-[#5850ec]/15"
          }`}
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-[11px] text-red-600">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms & Privacy Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.agreeToTerms}
            onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#5850ec] focus:ring-[#5850ec]/20 cursor-pointer accent-[#5850ec]"
          />
          <span className="text-xs text-zinc-600 leading-snug">
            I agree to the{" "}
            <Link
              href="/terms"
              className="font-medium text-[#5850ec] hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-[#5850ec] hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {fieldErrors.agreeToTerms && (
          <p className="mt-1 text-[11px] text-red-600">
            {fieldErrors.agreeToTerms}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isSuccess}
        className="w-full h-11 bg-[#5850ec] hover:bg-[#4d44e7] active:bg-[#4338ca] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-white"
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
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
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
