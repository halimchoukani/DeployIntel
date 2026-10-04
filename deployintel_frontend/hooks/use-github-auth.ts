"use client";

import { useState, useCallback } from "react";
import { getGithubAuthUrl, AuthError } from "@/lib/api/auth";
import { useGithubLoginMutation } from "./use-github-login";
import { LoginResponse } from "@/types/auth";

/**
 * Manages the full GitHub OAuth2 flow:
 * 1. Fetches the authorization URL from the backend
 * 2. Redirects the user to GitHub
 * 3. After redirect back, exchanges the code for a JWT
 */
export function useGithubAuth(
  onSuccess?: (data: LoginResponse) => void,
  onError?: (error: AuthError) => void
) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const githubMutation = useGithubLoginMutation({
    onSuccess: (data) => {
      // Persist token on GitHub login
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_id", data.userId);
      setError(null);
      onSuccess?.(data);
    },
    onError: (err) => {
      setError(err.message);
      onError?.(err);
    },
  });

  const initiateGithubLogin = useCallback(async () => {
    setIsRedirecting(true);
    setError(null);

    try {
      // GitHub must redirect back to the frontend callback page,
      // which then POSTs the code to the backend for token exchange.
      const redirectUri =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/github/callback`
          : undefined;

      const authUrl = await getGithubAuthUrl(redirectUri);
      window.location.href = authUrl;
    } catch (err) {
      setIsRedirecting(false);
      const msg =
        err instanceof AuthError
          ? err.message
          : "Failed to initiate GitHub login.";
      setError(msg);
      onError?.(err instanceof AuthError ? err : new AuthError(msg));
    }
  }, [onError]);

  const handleGithubCallback = useCallback(
    (code: string, redirectUri?: string) => {
      githubMutation.mutate({ code, redirectUri });
    },
    [githubMutation]
  );

  return {
    initiateGithubLogin,
    handleGithubCallback,
    isRedirecting,
    isExchangingCode: githubMutation.isPending,
    error,
    clearError: () => setError(null),
  };
}
