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
    <div className="w-full max-w-[460px] rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 md:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_2px_8px_rgb(0,0,0,0.02)] transition-all">
      <SigninHeader />
      <SigninSocialButtons />
      <AuthDivider label="OR CONTINUE WITH EMAIL" />
      <SigninForm onSuccess={onSuccess} />
      <SigninFooter />
    </div>
  );
}
