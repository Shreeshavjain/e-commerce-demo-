"use client";

import { useEffect } from "react";
import { CheckCircle2, Fingerprint, MessageSquareText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";
import { AuthTrigger } from "@/components/auth/auth-trigger";

type AuthSceneProps = {
  title: string;
  description: string;
  eyebrow?: string;
  autoOpenModal?: boolean;
  compact?: boolean;
  className?: string;
};

const steps = [
  {
    icon: MessageSquareText,
    title: "Enter your phone",
    description: "Firebase sends a one-time code in the browser using the client SDK.",
  },
  {
    icon: Fingerprint,
    title: "Verify the OTP",
    description: "The verified token is passed to the backend auth API.",
  },
  {
    icon: ShieldCheck,
    title: "Create the session",
    description: "The backend creates a secure cookie-backed session for refresh-safe auth.",
  },
];

export function AuthScene({
  title,
  description,
  eyebrow = "Frontend auth integration",
  autoOpenModal = false,
  compact = false,
  className,
}: AuthSceneProps) {
  const { user, status, isInitialized, isAuthModalOpen } = useAuthState();
  const { openAuthModal } = useAuthActions();

  useEffect(() => {
    if (autoOpenModal && isInitialized && !user && !isAuthModalOpen) {
      openAuthModal("phone");
    }
  }, [autoOpenModal, isAuthModalOpen, isInitialized, openAuthModal, user]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)] backdrop-blur",
        compact ? "p-5 sm:p-6" : "p-6 sm:p-8 lg:p-10",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_28%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            {eyebrow}
          </div>

          <div className="space-y-3">
            <h1 className={cn("text-balance font-semibold tracking-tight text-foreground", compact ? "text-3xl" : "text-4xl sm:text-5xl")}>{title}</h1>
            <p className={cn("max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base", compact && "max-w-xl")}>{description}</p>
          </div>

          <AuthTrigger className="w-full sm:w-auto" compact />

          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">0{index + 1}</div>
                  <h2 className="mt-2 text-sm font-medium text-foreground">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Session status</p>
              <h2 className="mt-2 text-lg font-semibold text-foreground">
                {status === "authenticated" ? "Signed in" : status === "restoring" ? "Restoring" : "Ready to sign in"}
              </h2>
            </div>

            <div className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              status === "authenticated"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : status === "restoring"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "bg-muted text-muted-foreground"
            )}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {status === "authenticated" ? "Active" : status === "restoring" ? "Checking" : "Offline"}
            </div>
          </div>

          {user ? (
            <div className="space-y-4 py-5">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Account</p>
                <p className="mt-2 text-base font-medium text-foreground">{user.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.phoneNumber ?? user.email}</p>
                <p className="mt-4 text-xs text-muted-foreground">Role: {user.role}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs text-muted-foreground">Phone verified</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{user.isPhoneVerified ? "Yes" : "No"}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs text-muted-foreground">Session state</p>
                  <p className="mt-2 text-sm font-medium text-foreground">Restored from cookie</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-5">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                The app will restore your backend session automatically on load. If the cookie is present, the frontend auth
                state hydrates before you interact with the page.
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Firebase handles OTP in the browser.
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  The backend decides whether this is a new account.
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  A secure session cookie survives refreshes.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}