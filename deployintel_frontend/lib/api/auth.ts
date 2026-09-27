import {
  RegisterPayload,
  UserResponse,
  LoginPayload,
  LoginResponse,
  GitHubCallbackParams,
  GitHubAuthUrlResponse,
} from "@/types/auth";

/**
 * Resolves the API base URL.
 * In the browser, we use a relative URL ("") so Next.js rewrites proxy /api/...
 * directly to the Spring Boot backend, avoiding CORS restrictions completely.
 */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080"
  );
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status?: number,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function registerUser(payload: RegisterPayload): Promise<UserResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/register`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = "Registration failed. Please check your credentials.";
      let fieldErrors: Record<string, string> | undefined;

      try {
        const errorData = await res.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
        if (errorData.errors && typeof errorData.errors === "object") {
          fieldErrors = errorData.errors;
        }
      } catch {
        errorMessage = `Request failed with status ${res.status}: ${res.statusText}`;
      }

      throw new AuthError(errorMessage, res.status, fieldErrors);
    }

    const data: UserResponse = await res.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AuthError(
        "Could not connect to the authentication server. Please ensure the backend is running on port 8080."
      );
    }

    throw new AuthError(
      error instanceof Error ? error.message : "An unexpected error occurred during signup."
    );
  }
}

// ─── Login ──────────────────────────────────────────────────────────────────

async function handleApiError(
  res: Response,
  defaultMessage: string
): Promise<never> {
  let errorMessage = defaultMessage;
  let fieldErrors: Record<string, string> | undefined;
  try {
    const errorData = await res.json();
    if (errorData.message) errorMessage = errorData.message;
    else if (typeof errorData === "string") errorMessage = errorData;
    if (errorData.errors && typeof errorData.errors === "object") {
      fieldErrors = errorData.errors;
    }
  } catch {
    errorMessage = `Request failed with status ${res.status}: ${res.statusText}`;
  }
  throw new AuthError(errorMessage, res.status, fieldErrors);
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/login`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await handleApiError(
        res,
        res.status === 401
          ? "Invalid email or password."
          : "Sign in failed. Please try again."
      );
    }

    return (await res.json()) as LoginResponse;
  } catch (error: unknown) {
    if (error instanceof AuthError) throw error;
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AuthError(
        "Could not connect to the authentication server. Please ensure the backend is running on port 8080."
      );
    }
    throw new AuthError(
      error instanceof Error ? error.message : "An unexpected error occurred during sign in."
    );
  }
}

// ─── GitHub OAuth2 ───────────────────────────────────────────────────────────

export async function getGithubAuthUrl(
  redirectUri?: string,
  state?: string
): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams();
  if (redirectUri) params.set("redirect_uri", redirectUri);
  if (state) params.set("state", state);
  const query = params.toString() ? `?${params.toString()}` : "";
  const url = `${baseUrl}/api/v1/auth/oauth2/authorize/github${query}`;

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      await handleApiError(res, "Failed to get GitHub authorization URL.");
    }
    const data: GitHubAuthUrlResponse = await res.json();
    return data.authorizationUrl;
  } catch (error: unknown) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(
      error instanceof Error ? error.message : "Failed to initiate GitHub login."
    );
  }
}

export async function loginWithGithub(
  params: GitHubCallbackParams
): Promise<LoginResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/auth/oauth2/github`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: params.code,
        redirectUri: params.redirectUri,
      }),
    });

    if (!res.ok) {
      await handleApiError(res, "GitHub authentication failed. Please try again.");
    }

    return (await res.json()) as LoginResponse;
  } catch (error: unknown) {
    if (error instanceof AuthError) throw error;
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AuthError(
        "Could not connect to the authentication server. Please ensure the backend is running on port 8080."
      );
    }
    throw new AuthError(
      error instanceof Error ? error.message : "An unexpected error occurred during GitHub login."
    );
  }
}
