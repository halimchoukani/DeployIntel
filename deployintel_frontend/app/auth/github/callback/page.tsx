"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGithubLoginMutation } from "@/hooks/use-github-login";

export default function GithubCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exchanged = useRef(false);

  const githubMutation = useGithubLoginMutation({
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_id", data.userId);
      // Redirect to dashboard or home
      router.replace("/dashboard");
    },
    onError: () => {
      // Redirect back to signin with error query param
      router.replace("/login?error=github_auth_failed");
    },
  });

  useEffect(() => {
    if (exchanged.current) return;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      router.replace(`/login?error=${errorParam}`);
      return;
    }

    if (code) {
      exchanged.current = true;
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      githubMutation.mutate({ code, redirectUri });
    } else {
      router.replace("/login?error=missing_code");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#5850ec]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">
            {githubMutation.isError
              ? "Authentication failed. Redirecting..."
              : "Completing GitHub sign-in…"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            You'll be redirected automatically.
          </p>
        </div>
      </div>
    </main>
  );
}
