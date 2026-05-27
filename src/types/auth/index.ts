import type { UserRole } from "@/models/constants";

export type AuthMethod = "google" | "otp";

export type VerifiedFirebaseToken = {
  uid: string;
  phoneNumber: string | null;
  email: string | null;
  name: string | null;
  picture: string | null;
  provider: AuthMethod;
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  image: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
};

export type AuthResponse<TUser = AuthenticatedUser> = {
  success: true;
  message: string;
  user: TUser;
  isNewUser: boolean;
};

export type AuthErrorResponse = {
  success: false;
  message: string;
  error?: string;
};

export type AuthResult<TUser = AuthenticatedUser> = AuthResponse<TUser> | AuthErrorResponse;