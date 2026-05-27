"use client";

import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthState() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      status: state.status,
      step: state.step,
      isAuthModalOpen: state.isAuthModalOpen,
      isInitialized: state.isInitialized,
      error: state.error,
      infoMessage: state.infoMessage,
      pendingPhoneNumber: state.pendingPhoneNumber,
      pendingIdToken: state.pendingIdToken,
    }))
  );
}

export function useAuthActions() {
  return useAuthStore(
    useShallow((state) => ({
      openAuthModal: state.openAuthModal,
      closeAuthModal: state.closeAuthModal,
      backToPhoneStep: state.backToPhoneStep,
      clearAuthMessage: state.clearAuthMessage,
      bootstrapSession: state.bootstrapSession,
      requestOtp: state.requestOtp,
      verifyOtp: state.verifyOtp,
      completeName: state.completeName,
      logout: state.logout,
    }))
  );
}

export function useAuthUser() {
  return useAuthStore((state) => state.user);
}

export function useAuthStatus() {
  return useAuthStore((state) => state.status);
}