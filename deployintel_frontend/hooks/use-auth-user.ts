"use client";

import { useQuery } from "@tanstack/react-query";

import { getAuthToken, performAutoLogout } from "@/lib/auth/session";

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
  const token = getAuthToken();

  if (!token) {
    performAutoLogout("unauthorized");
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
      performAutoLogout("session_expired");
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
