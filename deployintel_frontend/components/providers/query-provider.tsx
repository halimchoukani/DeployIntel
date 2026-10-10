"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { performAutoLogout } from "@/lib/auth/session";

function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;

  if (err.status === 401 || err.status === 403) return true;
  if (err.statusCode === 401 || err.statusCode === 403) return true;

  if (typeof err.message === "string") {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("unauthorized") ||
      msg.includes("token expired") ||
      msg.includes("jwt expired") ||
      msg.includes("no authentication token found")
    ) {
      return true;
    }
  }
  return false;
}

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (isAuthError(error)) {
              performAutoLogout("session_expired");
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isAuthError(error)) {
              performAutoLogout("session_expired");
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              // Never retry on auth errors
              if (isAuthError(error)) return false;
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
