"use client";

import { useQuery } from "@tanstack/react-query";

interface UserMeResponse {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  githubConnected?: boolean;
}

async function fetchAuthUser(): Promise<UserMeResponse> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      : null;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch("/api/v1/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_id");
        sessionStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    throw new Error("Failed to fetch user data");
  }

  return response.json();
}

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth_user"],
    queryFn: fetchAuthUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
