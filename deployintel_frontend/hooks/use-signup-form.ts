"use client";

import { useState, useTransition } from "react";
import { SignupFormData } from "@/types/auth";
import { usePasswordStrength } from "./use-password-strength";
import { useSignupMutation } from "./use-signup";

const initialValues: SignupFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
};

export function useSignupForm(onSuccessCallback?: () => void) {
  const [values, setValues] = useState<SignupFormData>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const passwordStrength = usePasswordStrength(values.password);

  const signupMutation = useSignupMutation({
    onSuccess: (data) => {
      setSuccessMessage(
        `Account created successfully for ${data.firstName || values.firstName}! Redirecting...`
      );
      setGeneralError(null);
      setFieldErrors({});
      if (onSuccessCallback) {
        setTimeout(() => {
          onSuccessCallback();
        }, 1500);
      }
    },
    onError: (err) => {
      setSuccessMessage(null);
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors as Partial<Record<keyof SignupFormData, string>>);
      }
      setGeneralError(err.message || "Signup failed. Please try again.");
    },
  });

  const handleChange = (name: keyof SignupFormData, value: string | boolean) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user updates the field
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SignupFormData, string>> = {};

    if (!values.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!values.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!values.email.trim()) {
      errors.email = "Work email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!values.password) {
      errors.password = "Password is required";
    } else if (values.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!values.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the Terms and Privacy Policy";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    startTransition(() => {
      signupMutation.mutate({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    });
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return {
    values,
    showPassword,
    fieldErrors,
    generalError,
    successMessage,
    passwordStrength,
    isSubmitting: signupMutation.isPending,
    isSuccess: signupMutation.isSuccess,
    handleChange,
    toggleShowPassword,
    handleSubmit,
    setValues,
  };
}
