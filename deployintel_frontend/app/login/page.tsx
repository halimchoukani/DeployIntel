import type { Metadata } from "next";
import { Suspense } from "react";
import { SigninCard } from "@/components/auth/signin-card";

export const metadata: Metadata = {
  title: "Sign In - DeployIntel",
  description: "Sign in to your DeployIntel account to manage deployment risk intelligence.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#f8fafc]">
      <Suspense fallback={
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#5850ec]" />
        </div>
      }>
        <SigninCard />
      </Suspense>
    </main>
  );
}
