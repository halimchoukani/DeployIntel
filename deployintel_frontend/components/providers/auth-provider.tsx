"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getAuthToken,
  isJwtExpired,
  getTokenRemainingTimeMs,
  syncAuthCookie,
  performAutoLogout,
} from "@/lib/auth/session";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  logout: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_PREFIXES = ["/login", "/signup", "/oauth2", "/auth"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Synchronize and validate auth on mount and route change
  useEffect(() => {
    // 1. Sync cookie for Next.js proxy
    syncAuthCookie();

    // 2. Read and validate token
    const currentToken = getAuthToken();
    const isPublic = isPublicRoute(pathname);

    if (currentToken) {
      if (isJwtExpired(currentToken)) {
        performAutoLogout("session_expired");
        return;
      }

      setToken(currentToken);

      // If user is already authenticated and visits /login or /signup, redirect to /dashboard
      if (pathname === "/login" || pathname === "/signup") {
        startTransition(() => {
          router.replace("/dashboard");
        });
        return;
      }
    } else {
      setToken(null);

      // If on protected route without a token, redirect to /login
      if (!isPublic && pathname !== "/") {
        performAutoLogout("unauthorized");
        return;
      }
    }

    setIsInitialized(true);
  }, [pathname, router]);

  // Set up auto-logout timers and listeners
  useEffect(() => {
    if (!token) return;

    // A. Check if already expired
    if (isJwtExpired(token)) {
      performAutoLogout("session_expired");
      return;
    }

    // B. Calculate remaining duration and set timer
    const remainingMs = getTokenRemainingTimeMs(token);
    let timerId: NodeJS.Timeout | null = null;

    if (remainingMs !== null && remainingMs > 0) {
      timerId = setTimeout(() => {
        performAutoLogout("session_expired");
      }, remainingMs);
    }

    // C. Check expiration on window focus / visibility change
    const checkExpiration = () => {
      const activeToken = getAuthToken();
      if (!activeToken || isJwtExpired(activeToken)) {
        performAutoLogout("session_expired");
      }
    };

    window.addEventListener("focus", checkExpiration);
    document.addEventListener("visibilitychange", checkExpiration);

    // D. Periodic check every 15 seconds
    const intervalId = setInterval(checkExpiration, 15000);

    // E. Synchronize logout across browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" && !e.newValue) {
        performAutoLogout("session_expired");
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (timerId) clearTimeout(timerId);
      clearInterval(intervalId);
      window.removeEventListener("focus", checkExpiration);
      document.removeEventListener("visibilitychange", checkExpiration);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token]);

  // Prevent flash of protected layout before auth status is verified
  const isPublic = isPublicRoute(pathname);
  if (!isInitialized && !isPublic && pathname !== "/") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#5850ec]" />
          </div>
          <p className="text-xs font-medium text-zinc-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        logout: (reason) => performAutoLogout(reason),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
