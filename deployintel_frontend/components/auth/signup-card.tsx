"use client";

import React from "react";
import { SignupHeader } from "./signup-header";
import { SocialAuthButtons } from "./social-auth-buttons";
import { AuthDivider } from "./auth-divider";
import { SignupForm } from "./signup-form";
import { AuthFooter } from "./auth-footer";

interface SignupCardProps {
  onSuccess?: () => void;
}

export function SignupCard({ onSuccess }: SignupCardProps) {
  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 md:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_2px_8px_rgb(0,0,0,0.02)] transition-all">
      {/* Brand & Header */}
      <SignupHeader />

      {/* Social Single Sign-On */}
      <SocialAuthButtons />

      {/* Divider */}
      <AuthDivider />

      {/* Main Registration Form */}
      <SignupForm onSuccess={onSuccess} />

      {/* Footer & Security Note */}
      <AuthFooter />
    </div>
  );
}
