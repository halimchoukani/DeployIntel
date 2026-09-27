import type { Metadata } from "next";
import { SigninCard } from "@/components/auth/signin-card";

export const metadata: Metadata = {
  title: "Sign In - DeployIntel",
  description: "Sign in to your DeployIntel account to manage deployment risk intelligence.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#f8fafc]">
      <SigninCard />
    </main>
  );
}
