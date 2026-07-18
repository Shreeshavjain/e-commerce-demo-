"use client";

import { getAdditionalUserInfo, PhoneAuthProvider, RecaptchaVerifier, signInWithCredential, signInWithPhoneNumber, signOut } from "firebase/auth";
import { create } from "zustand";
import { toast } from "sonner";
import { submitAuthLogin, submitAuthLogout, restoreAuthSession } from "@/lib/auth/client";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import { getFirebaseClientAuth } from "@/services/firebase/client";
import type { AuthenticatedUser } from "@/types/auth";

export type AuthStep = "phone" | "otp" | "name";
export type AuthStatus = "restoring" | "unauthenticated" | "authenticating" | "authenticated";

type AuthStoreState = {
  user: AuthenticatedUser | null;
  status: AuthStatus;
  step: AuthStep;
  isAuthModalOpen: boolean;
  isInitialized: boolean;
  error: string | null;
  infoMessage: string | null;
  pendingPhoneNumber: string;
  pendingVerificationId: string | null;
  pendingIdToken: string | null;
  redirectAfterAuth: string | null;
  openAuthModal: (step?: AuthStep, redirectAfterAuth?: string) => void;
  closeAuthModal: () => void;
  backToPhoneStep: () => void;
  clearAuthMessage: () => void;
  bootstrapSession: () => Promise<void>;
  requestOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<{ needsName: boolean }>;
  completeName: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

let recaptchaVerifier: RecaptchaVerifier | null = null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function clearRecaptchaVerifier() {
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
}

async function getOrCreateRecaptchaVerifier() {
  const auth = getFirebaseClientAuth();

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, "auth-recaptcha-container", {
      size: "invisible",
    });
    await recaptchaVerifier.render();
  }

  return recaptchaVerifier;
}

const initialState = {
  user: null,
  status: "restoring" as const,
  step: "phone" as const,
  isAuthModalOpen: false,
  isInitialized: false,
  error: null,
  infoMessage: null,
  pendingPhoneNumber: "",
  pendingVerificationId: null,
  pendingIdToken: null,
  redirectAfterAuth: null as string | null,
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  ...initialState,
  openAuthModal: (step = "phone", redirectAfterAuth) => {
    set({
      isAuthModalOpen: true,
      step,
      error: null,
      infoMessage: null,
      ...(redirectAfterAuth !== undefined ? { redirectAfterAuth } : {}),
    });
  },
  closeAuthModal: () => {
    set({
      isAuthModalOpen: false,
      step: "phone",
      error: null,
      infoMessage: null,
      pendingPhoneNumber: "",
      pendingVerificationId: null,
      pendingIdToken: null,
      redirectAfterAuth: null,
    });
  },
  backToPhoneStep: () => {
    clearRecaptchaVerifier();
    set({
      step: "phone",
      error: null,
      infoMessage: null,
      pendingVerificationId: null,
      pendingIdToken: null,
    });
  },
  clearAuthMessage: () => {
    set({ error: null, infoMessage: null });
  },
  bootstrapSession: async () => {
    if (get().isInitialized) {
      return;
    }

    set({ status: "restoring", error: null, infoMessage: "Checking your saved session..." });

    try {
      const user = await restoreAuthSession();

      if (user) {
        set({
          user,
          status: "authenticated",
          infoMessage: "Session restored",
        });
      } else {
        await signOut(getFirebaseClientAuth()).catch(() => undefined);
        set({
          user: null,
          status: "unauthenticated",
          infoMessage: null,
        });
      }
    } catch (error) {
      set({
        user: null,
        status: "unauthenticated",
        error: getErrorMessage(error),
        infoMessage: null,
      });
    } finally {
      set({ isInitialized: true });
    }
  },
  requestOtp: async (phoneNumber: string) => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      set({ error: "Enter a valid phone number" });
      return;
    }

    set({
      status: "authenticating",
      error: null,
      infoMessage: "Sending your verification code...",
      pendingPhoneNumber: normalizedPhone,
      pendingVerificationId: null,
      pendingIdToken: null,
    });

    try {
      const auth = getFirebaseClientAuth();
      const verifier = await getOrCreateRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, verifier);

      set({
        status: "unauthenticated",
        step: "otp",
        pendingVerificationId: confirmation.verificationId,
        infoMessage: `We sent a one-time code to ${normalizedPhone}`,
      });

      toast.success("Verification code sent");
    } catch (error) {
      clearRecaptchaVerifier();
      const message = getErrorMessage(error);

      set({
        status: "unauthenticated",
        error: message,
        infoMessage: null,
      });

      toast.error(message);
    }
  },
  verifyOtp: async (code: string) => {
    const verificationId = get().pendingVerificationId;

    if (!verificationId) {
      const message = "Request a verification code first";
      set({ error: message });
      throw new Error(message);
    }

    set({
      status: "authenticating",
      error: null,
      infoMessage: "Verifying your code...",
    });

    try {
      const auth = getFirebaseClientAuth();
      const credential = PhoneAuthProvider.credential(verificationId, code.trim());
      const result = await signInWithCredential(auth, credential);
      const idToken = await result.user.getIdToken(true);
      const additionalInfo = getAdditionalUserInfo(result);
      const needsName = Boolean(additionalInfo?.isNewUser && !result.user.displayName?.trim());

      if (needsName) {
        set({
          status: "unauthenticated",
          step: "name",
          pendingIdToken: idToken,
          infoMessage: "New accounts need a display name before the backend session is created.",
        });

        toast.message("Add your name to finish the account");
        return { needsName: true };
      }

      const response = await submitAuthLogin({
        idToken,
        displayName: result.user.displayName?.trim() || undefined,
      });

      await signOut(auth).catch(() => undefined);
      clearRecaptchaVerifier();

      const redirectPath = get().redirectAfterAuth;

      set({
        user: response.user,
        status: "authenticated",
        isAuthModalOpen: false,
        step: "phone",
        error: null,
        infoMessage: response.message,
        pendingPhoneNumber: "",
        pendingVerificationId: null,
        pendingIdToken: null,
        redirectAfterAuth: null,
      });

      toast.success(response.message);

      if (redirectPath) {
        window.location.href = redirectPath;
      }

      return { needsName: false };
    } catch (error) {
      const message = getErrorMessage(error);

      set({
        status: "unauthenticated",
        error: message,
        infoMessage: null,
      });

      toast.error(message);
      throw error;
    }
  },
  completeName: async (displayName: string) => {
    const idToken = get().pendingIdToken;

    if (!idToken) {
      const message = "Verification must be completed before adding a name";
      set({ error: message });
      throw new Error(message);
    }

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      const message = "Enter your name to continue";
      set({ error: message });
      throw new Error(message);
    }

    set({
      status: "authenticating",
      error: null,
      infoMessage: "Creating your account...",
    });

    try {
      const response = await submitAuthLogin({
        idToken,
        displayName: trimmedName,
      });

      await signOut(getFirebaseClientAuth()).catch(() => undefined);
      clearRecaptchaVerifier();

      const redirectPath = get().redirectAfterAuth;

      set({
        user: response.user,
        status: "authenticated",
        isAuthModalOpen: false,
        step: "phone",
        error: null,
        infoMessage: response.message,
        pendingPhoneNumber: "",
        pendingVerificationId: null,
        pendingIdToken: null,
        redirectAfterAuth: null,
      });

      toast.success(response.message);

      if (redirectPath) {
        window.location.href = redirectPath;
      }
    } catch (error) {
      const message = getErrorMessage(error);

      set({
        status: "unauthenticated",
        error: message,
        infoMessage: null,
      });

      toast.error(message);
    }
  },
  logout: async () => {
    set({
      status: "authenticating",
      error: null,
      infoMessage: "Signing you out...",
    });

    try {
      await submitAuthLogout();
      await signOut(getFirebaseClientAuth()).catch(() => undefined);
      clearRecaptchaVerifier();

      set({
        user: null,
        status: "unauthenticated",
        isAuthModalOpen: false,
        step: "phone",
        error: null,
        infoMessage: "Signed out successfully",
        pendingPhoneNumber: "",
        pendingVerificationId: null,
        pendingIdToken: null,
        redirectAfterAuth: null,
      });

      toast.success("Signed out successfully");
    } catch (error) {
      const message = getErrorMessage(error);

      set({
        status: "authenticated",
        error: message,
        infoMessage: null,
      });

      toast.error(message);
    }
  },
}));

export type { AuthStoreState };