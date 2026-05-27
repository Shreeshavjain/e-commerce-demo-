"use client";

import { Loader2, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";

type AuthTriggerProps = {
  className?: string;
  compact?: boolean;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AuthTrigger({ className, compact = false }: AuthTriggerProps) {
  const { user, status } = useAuthState();
  const { openAuthModal, logout } = useAuthActions();

  const isBusy = status === "authenticating" || status === "restoring";

  if (user) {
    return (
      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-foreground text-sm font-medium text-background">
            {user.image ? <img src={user.image} alt={user.name} className="h-full w-full object-cover" /> : getInitials(user.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.phoneNumber ?? user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          disabled={isBusy}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 text-sm font-medium text-foreground transition",
            "hover:bg-background disabled:cursor-not-allowed disabled:opacity-50",
            compact && "sm:w-auto"
          )}
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openAuthModal("phone")}
      disabled={isBusy}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-medium text-background transition",
        "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
      Sign in with phone
    </button>
  );
}