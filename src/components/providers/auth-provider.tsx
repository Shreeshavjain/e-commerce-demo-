"use client";

import { useEffect } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";
import { syncCartWithAuth } from "@/stores/cart-store";

// The provider performs one bootstrap pass on app load so the backend session cookie becomes the source of truth.
export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { bootstrapSession } = useAuthActions();
  const { isInitialized, user } = useAuthState();

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    if (isInitialized) {
      syncCartWithAuth(!!user);
    }
  }, [isInitialized, user]);

  return (
    <>
      {children}
      <AuthModal isReady={isInitialized} />
    </>
  );
}