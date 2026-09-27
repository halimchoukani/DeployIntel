import { RegisterPayload, UserResponse } from "@/types/auth";

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
