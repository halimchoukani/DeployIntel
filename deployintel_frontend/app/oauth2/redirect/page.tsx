"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setAuthSession } from "@/lib/auth/session";

/**
 * Landing page for Spring Security's OAuth2 success handler.
 * The backend redirects here with ?token=...&userId=...&email=...
 * after a successful Spring-managed OAuth2 flow.
 *
 * Route: /oauth2/redirect
 * Configured via: security.oauth2.redirect-uri in application-local.yml
 */
function OAuth2RedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token && userId && email) {
      setAuthSession(token, { email, userId });
      router.replace("/dashboard");
    } else {
      router.replace("/login?error=oauth2_missing_params");
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#5850ec]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">Completing sign-in…</p>
          <p className="mt-1 text-xs text-zinc-400">You&apos;ll be redirected automatically.</p>
        </div>
      </div>
    </main>
  );
}

export default function OAuth2RedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#5850ec]" />
          </div>
        </main>
      }
    >
      <OAuth2RedirectInner />
    </Suspense>
  );
}
