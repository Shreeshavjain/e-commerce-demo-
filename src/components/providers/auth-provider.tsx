"use client";

import { useEffect } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";

// The provider performs one bootstrap pass on app load so the backend session cookie becomes the source of truth.
export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { bootstrapSession } = useAuthActions();
  const { isInitialized } = useAuthState();

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  return (
    <>
      {children}
      <AuthModal isReady={isInitialized} />
    </>
  );
}