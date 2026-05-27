"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleAlert, Loader2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";

type AuthModalProps = {
  isReady: boolean;
};

function stepMeta(step: "phone" | "otp" | "name") {
  switch (step) {
    case "otp":
      return {
        title: "Enter the one-time code",
        description: "We sent a verification code to your phone number.",
      };
    case "name":
      return {
        title: "Finish your profile",
        description: "New accounts need a display name before the secure session is created.",
      };
    default:
      return {
        title: "Sign in with your phone number",
        description: "Use a one-time code to create or restore your account.",
      };
  }
}

export function AuthModal({ isReady }: AuthModalProps) {
  const { isAuthModalOpen, step, error, infoMessage, pendingPhoneNumber, status } = useAuthState();
  const { closeAuthModal, backToPhoneStep, requestOtp, verifyOtp, completeName, clearAuthMessage } = useAuthActions();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [displayName, setDisplayName] = useState("");

  const isBusy = status === "authenticating";
  const meta = useMemo(() => stepMeta(step), [step]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setPhoneNumber("");
      setOtpCode("");
      setDisplayName("");
      return;
    }

    if (step === "phone") {
      setPhoneNumber(pendingPhoneNumber);
      setOtpCode("");
      setDisplayName("");
    }

    if (step === "otp") {
      setPhoneNumber(pendingPhoneNumber);
      setOtpCode("");
    }

    if (step === "name") {
      setDisplayName("");
    }
  }, [isAuthModalOpen, pendingPhoneNumber, step]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAuthModal, isAuthModalOpen]);

  if (!isAuthModalOpen) {
    return <div id="auth-recaptcha-container" className="sr-only" />;
  }

  return (
    <AnimatePresence>
      {isAuthModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 sm:items-center">
          <motion.button
            aria-label="Close authentication dialog"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={closeAuthModal}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            aria-describedby="auth-modal-description"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-6"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure session flow
                </div>
                <h2 id="auth-modal-title" className="text-xl font-semibold tracking-tight text-foreground">
                  {meta.title}
                </h2>
                <p id="auth-modal-description" className="mt-2 text-sm leading-6 text-muted-foreground">
                  {meta.description}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAuthModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {infoMessage ? (
              <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                {infoMessage}
              </div>
            ) : null}

            {!isReady ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing auth session...
              </div>
            ) : null}

            <div className="mt-6 space-y-5">
              {step === "phone" ? (
                <form
                  className="space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    clearAuthMessage();
                    await requestOtp(phoneNumber);
                  }}
                >
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Phone number</span>
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+1 555 123 4567"
                      className="h-12 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground/25 focus:ring-2 focus:ring-foreground/10"
                    />
                  </label>

                  <p className="text-xs leading-5 text-muted-foreground">
                    We only use the number to create a secure session. The backend verifies the Firebase token after the code is confirmed.
                  </p>

                  <button
                    type="submit"
                    disabled={isBusy || !phoneNumber.trim()}
                    className={cn(
                      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-medium text-background transition",
                      "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send verification code"}
                  </button>
                </form>
              ) : null}

              {step === "otp" ? (
                <form
                  className="space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    clearAuthMessage();
                    await verifyOtp(otpCode);
                  }}
                >
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Verification code</span>
                    <input
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      className="h-12 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm tracking-[0.3em] outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground focus:border-foreground/25 focus:ring-2 focus:ring-foreground/10"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={backToPhoneStep}
                      className="inline-flex items-center gap-2 rounded-full px-0 py-0 font-medium text-foreground/80 transition hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change phone number
                    </button>

                    <span>Code sent to {pendingPhoneNumber}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy || otpCode.trim().length < 4}
                    className={cn(
                      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-medium text-background transition",
                      "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}
                  </button>
                </form>
              ) : null}

              {step === "name" ? (
                <form
                  className="space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    clearAuthMessage();
                    await completeName(displayName);
                  }}
                >
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Display name</span>
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      autoComplete="name"
                      placeholder="Your name"
                      className="h-12 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground/25 focus:ring-2 focus:ring-foreground/10"
                    />
                  </label>

                  <p className="text-xs leading-5 text-muted-foreground">
                    This name is stored in MongoDB and used across future orders, receipts, and customer support flows.
                  </p>

                  <button
                    type="submit"
                    disabled={isBusy || !displayName.trim()}
                    className={cn(
                      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-foreground px-4 text-sm font-medium text-background transition",
                      "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish account"}
                  </button>
                </form>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Backend session cookie
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1">
                Firebase OTP on the client
              </span>
            </div>

            <div id="auth-recaptcha-container" className="sr-only" />
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}