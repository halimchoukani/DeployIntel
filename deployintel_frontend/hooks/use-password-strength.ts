"use client";

import { useMemo } from "react";
import { PasswordStrengthResult, PasswordStrengthLevel } from "@/types/auth";

export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const hasNumberAndSymbol = hasNumber && hasSymbol;

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasNumberAndSymbol) score += 1;

    let label: PasswordStrengthLevel = "Too weak";
    let colorClass = "text-zinc-400";

    if (password.length > 0) {
      if (score === 3) {
        label = "Strong";
        colorClass = "text-[#5850ec]";
      } else if (score === 2) {
        label = "Fair";
        colorClass = "text-indigo-500";
      } else {
        label = "Weak";
        colorClass = "text-amber-500";
      }
    }

    return {
      score,
      label,
      criteria: {
        hasMinLength,
        hasUppercase,
        hasNumberAndSymbol,
      },
      colorClass,
    };
  }, [password]);
}
