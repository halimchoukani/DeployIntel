import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "access_token";

// Paths that never require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/oauth2",
  "/auth",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      // Non-JWT token fallback
      return true;
    }
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(payloadBase64);
    const payload = JSON.parse(jsonStr);

    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    }
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasValidToken = isTokenValid(tokenCookie);

  // Root path "/" redirects to /dashboard if logged in, otherwise /login
  if (pathname === "/") {
    if (hasValidToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already authenticated user visiting /login or /signup -> redirect to /dashboard
  if (pathname === "/login" || pathname === "/signup") {
    if (hasValidToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Allow other public routes (like OAuth2 callbacks)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // All other routes (e.g. /dashboard, /projects, /settings) are protected:
  // User must have a valid token. If not, redirect to /login
  if (!hasValidToken) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    // Clean expired or invalid token cookie
    if (tokenCookie) {
      response.cookies.delete(AUTH_COOKIE_NAME);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (/api/...)
     * - static image extensions (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
