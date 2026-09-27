"use client";

import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { loginWithGithub, AuthError } from "@/lib/api/auth";
import { GitHubCallbackParams, LoginResponse } from "@/types/auth";

interface UseGithubLoginOptions {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: AuthError) => void;
}

export function useGithubLoginMutation(
  options?: UseGithubLoginOptions
): UseMutationResult<LoginResponse, AuthError, GitHubCallbackParams> {
  return useMutation<LoginResponse, AuthError, GitHubCallbackParams>({
    mutationFn: (params: GitHubCallbackParams) => loginWithGithub(params),
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: (error) => options?.onError?.(error),
  });
}
