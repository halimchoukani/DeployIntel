"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SigninFormData } from "@/types/auth";
import { useLoginMutation } from "./use-login";

import { setAuthSession } from "@/lib/auth/session";

const initialValues: SigninFormData = {
  email: "",
  password: "",
  rememberMe: true,
};

function getUrlErrorMessage(urlError: string | null | undefined): string | null {
  if (!urlError) return null;
  if (urlError === "github_auth_failed") return "GitHub authentication failed.";
  if (urlError === "missing_code") return "GitHub authentication returned no code.";
  if (urlError === "oauth2_missing_params") return "OAuth2 provider did not return required user data.";
  if (urlError === "session_expired") return "Your session has expired. Please sign in again.";
  if (urlError === "unauthorized") return "Please sign in to access your dashboard.";
  return decodeURIComponent(urlError);
}

export function useSigninForm(onSuccessCallback?: () => void) {
  const searchParams = useSearchParams();
  const urlError = searchParams?.get("error");
  const initialUrlError = getUrlErrorMessage(urlError);

  const [values, setValues] = useState<SigninFormData>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SigninFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(initialUrlError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      // Persist session across storage and cookies
      setAuthSession(
        data.accessToken,
        { email: data.email, userId: data.userId },
        values.rememberMe
      );

      setSuccessMessage("Sign in successful! Redirecting...");
      setGeneralError(null);
      setFieldErrors({});

      const targetPath = searchParams?.get("redirect") || "/dashboard";

      if (onSuccessCallback) {
        setTimeout(() => {
          onSuccessCallback();
        }, 1000);
      }
      router.replace(targetPath);
    },
    onError: (err) => {
      setSuccessMessage(null);
      if (err.fieldErrors) {
        setFieldErrors(
          err.fieldErrors as Partial<Record<keyof SigninFormData, string>>
        );
      }
      setGeneralError(err.message || "Sign in failed. Please try again.");
    },
  });

  const handleChange = (
    name: keyof SigninFormData,
    value: string | boolean
  ) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SigninFormData, string>> = {};

    if (!values.email.trim()) {
      errors.email = "Work email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!values.password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(() => {
      loginMutation.mutate({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    });
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return {
    values,
    showPassword,
    fieldErrors,
    generalError,
    successMessage,
    isSubmitting: loginMutation.isPending,
    isSuccess: loginMutation.isSuccess,
    handleChange,
    toggleShowPassword,
    handleSubmit,
  };
}
