"use client";

import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { registerUser, AuthError } from "@/lib/api/auth";
import { RegisterPayload, UserResponse } from "@/types/auth";

interface UseSignupOptions {
  onSuccess?: (data: UserResponse) => void;
  onError?: (error: AuthError) => void;
}

export function useSignupMutation(
  options?: UseSignupOptions
): UseMutationResult<UserResponse, AuthError, RegisterPayload> {
  return useMutation<UserResponse, AuthError, RegisterPayload>({
    mutationFn: async (payload: RegisterPayload) => {
      return await registerUser(payload);
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
