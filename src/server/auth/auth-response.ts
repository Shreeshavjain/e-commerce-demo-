import type { AuthErrorResponse, AuthResponse, AuthenticatedUser } from "@/types/auth";

export type AuthActionResponse = {
  success: true;
  message: string;
};

// A single response shape makes auth endpoints predictable for future frontend and mobile clients.
export function createAuthSuccessResponse(
  user: AuthenticatedUser,
  isNewUser: boolean,
  message = "Authentication successful"
): AuthResponse {
  return {
    success: true,
    message,
    user,
    isNewUser,
  };
}

// Standard auth errors keep token, OTP, and profile-creation failures consistent across the backend.
export function createAuthErrorResponse(message: string, error?: string): AuthErrorResponse {
  return {
    success: false,
    message,
    ...(error ? { error } : {}),
  };
}

export function createAuthActionResponse(message: string): AuthActionResponse {
  return {
    success: true,
    message,
  };
}