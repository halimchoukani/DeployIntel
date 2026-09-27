import type { Metadata } from "next";
import { SignupCard } from "@/components/auth/signup-card";

export const metadata: Metadata = {
  title: "Create Account - DeployIntel",
  description: "Create your DeployIntel account and start analyzing deployment risk before production.",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#f8fafc]">
      <SignupCard />
    </main>
  );
}
