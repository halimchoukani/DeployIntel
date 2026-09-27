export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UserResponse {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  token?: string;
}

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumberAndSymbol: boolean;
}

export type PasswordStrengthLevel = "Too weak" | "Weak" | "Fair" | "Strong";

export interface PasswordStrengthResult {
  score: number; // 0 to 3
  label: PasswordStrengthLevel;
  criteria: PasswordCriteria;
  colorClass: string;
}
