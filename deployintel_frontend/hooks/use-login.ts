"use client";

import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { loginUser, AuthError } from "@/lib/api/auth";
import { LoginPayload, LoginResponse } from "@/types/auth";

interface UseLoginOptions {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: AuthError) => void;
}

export function useLoginMutation(
  options?: UseLoginOptions
): UseMutationResult<LoginResponse, AuthError, LoginPayload> {
  return useMutation<LoginResponse, AuthError, LoginPayload>({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: (error) => options?.onError?.(error),
  });
}
