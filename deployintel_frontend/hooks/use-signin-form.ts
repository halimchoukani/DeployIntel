"use client";

import { useState, useTransition } from "react";
import { SigninFormData } from "@/types/auth";
import { useLoginMutation } from "./use-login";

const initialValues: SigninFormData = {
  email: "",
  password: "",
  rememberMe: true,
};

export function useSigninForm(onSuccessCallback?: () => void) {
  const [values, setValues] = useState<SigninFormData>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SigninFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      // Persist token according to rememberMe preference
      if (values.rememberMe) {
        localStorage.setItem("access_token", data.accessToken);
        localStorage.setItem("user_email", data.email);
        localStorage.setItem("user_id", data.userId);
      } else {
        sessionStorage.setItem("access_token", data.accessToken);
        sessionStorage.setItem("user_email", data.email);
        sessionStorage.setItem("user_id", data.userId);
      }
      setSuccessMessage("Sign in successful! Redirecting...");
      setGeneralError(null);
      setFieldErrors({});
      if (onSuccessCallback) {
        setTimeout(() => {
          onSuccessCallback();
        }, 1000);
      }
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
