"use client";

import React from "react";
import { SigninHeader } from "./signin-header";
import { SigninSocialButtons } from "./signin-social-buttons";
import { AuthDivider } from "./auth-divider";
import { SigninForm } from "./signin-form";
import { SigninFooter } from "./signin-footer";

interface SigninCardProps {
  onSuccess?: () => void;
}

export function SigninCard({ onSuccess }: SigninCardProps) {
  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-card-border bg-card text-foreground p-6 sm:p-8 md:p-9 shadow-xl transition-all">
      <SigninHeader />
      <SigninSocialButtons />
      <AuthDivider label="OR CONTINUE WITH EMAIL" />
      <SigninForm onSuccess={onSuccess} />
      <SigninFooter />
    </div>
  );
}
