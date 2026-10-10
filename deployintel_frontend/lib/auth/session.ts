"use client";

export const AUTH_TOKEN_KEY = "access_token";
export const USER_EMAIL_KEY = "user_email";
export const USER_ID_KEY = "user_id";
export const AUTH_COOKIE_NAME = "access_token";

/**
 * Checks if a JWT token is expired based on its "exp" claim.
 * Returns true if expired or invalid.
 * If token is not in JWT format (e.g. mock/opaque token), returns false.
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      // Non-JWT token
      return false;
    }
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr =
      typeof atob === "function"
        ? atob(payloadBase64)
        : typeof Buffer !== "undefined"
        ? Buffer.from(payloadBase64, "base64").toString("utf-8")
        : "";

    if (!jsonStr) return false;
    const payload = JSON.parse(jsonStr);

    if (typeof payload.exp === "number") {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      // If expiration is now or in the past, token is expired
      return payload.exp <= nowInSeconds;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Calculates remaining milliseconds until JWT expiration.
 * Returns null if token is not JWT or has no exp.
 * Returns 0 if already expired.
 */
export function getTokenRemainingTimeMs(token: string | null | undefined): number | null {
  if (!token) return 0;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr =
      typeof atob === "function"
        ? atob(payloadBase64)
        : typeof Buffer !== "undefined"
        ? Buffer.from(payloadBase64, "base64").toString("utf-8")
        : "";

    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr);

    if (typeof payload.exp === "number") {
      const remainingMs = payload.exp * 1000 - Date.now();
      return remainingMs > 0 ? remainingMs : 0;
    }
    return null;
  } catch {
    return 0;
  }
}

/**
 * Sets access_token cookie so Next.js server-side proxy can inspect it.
 */
function setTokenCookie(token: string, rememberMe = true) {
  if (typeof document === "undefined") return;
  const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24; // 7 days or 1 day
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Removes access_token cookie.
 */
function removeTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Stores authentication session in storage and cookie.
 */
export function setAuthSession(
  token: string,
  user?: { email?: string; userId?: string },
  rememberMe = true
) {
  if (typeof window === "undefined") return;

  if (rememberMe) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (user?.email) localStorage.setItem(USER_EMAIL_KEY, user.email);
    if (user?.userId) localStorage.setItem(USER_ID_KEY, user.userId);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    if (user?.email) sessionStorage.setItem(USER_EMAIL_KEY, user.email);
    if (user?.userId) sessionStorage.setItem(USER_ID_KEY, user.userId);
  }

  setTokenCookie(token, rememberMe);
}

/**
 * Retrieves access token from localStorage, sessionStorage, or cookie.
 * Validates expiration; if expired, clears session and returns null.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  let token =
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (!token && typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (token && isJwtExpired(token)) {
    clearAuthSession();
    return null;
  }

  return token;
}

/**
 * Ensures cookie is in sync if token is stored in localStorage/sessionStorage.
 */
export function syncAuthCookie(): void {
  if (typeof window === "undefined") return;
  const token =
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (token && !isJwtExpired(token)) {
    setTokenCookie(token, true);
  }
}

/**
 * Clears all auth data from storage and cookies.
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ID_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(USER_EMAIL_KEY);
  sessionStorage.removeItem(USER_ID_KEY);
  removeTokenCookie();
}

/**
 * Flags to prevent multiple rapid auto-logout redirects.
 */
let isLoggingOut = false;

/**
 * Triggers auto-logout: clears auth state and redirects to /login.
 */
export function performAutoLogout(reason = "session_expired"): void {
  if (typeof window === "undefined" || isLoggingOut) return;
  isLoggingOut = true;

  clearAuthSession();

  const currentPath = window.location.pathname;
  // If already on login or signup, don't re-redirect in a loop
  if (currentPath === "/login" || currentPath === "/signup") {
    isLoggingOut = false;
    return;
  }

  const query = reason ? `?error=${encodeURIComponent(reason)}` : "";
  window.location.href = `/login${query}`;
}
