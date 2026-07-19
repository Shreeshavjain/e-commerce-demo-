"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";

/* ─── Inner content (needs useSearchParams which requires Suspense) ── */

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      {/* ── Success icon with pulse animation ── */}
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        {/* Decorative ring that pulses on mount */}
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10 [animation-duration:2s] [animation-iteration-count:3]" />
      </div>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Order Confirmed!
      </h1>

      <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
        Thank you for your purchase. Your payment has been verified and your order is being processed.
      </p>

      {/* ── Order ID badge ── */}
      {orderId && (
        <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 shadow-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Order ID</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {orderId.slice(-8).toUpperCase()}
          </span>
        </div>
      )}

      {/* ── What happens next ── */}
      <div className="mt-10 w-full max-w-sm rounded-[1.5rem] border border-border bg-card/85 p-5 text-left shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          What happens next
        </p>
        <ul className="mt-4 space-y-3">
          {[
            "You'll receive an order confirmation shortly",
            "Our team will prepare your items for shipping",
            "You'll receive tracking details once shipped",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-xs font-semibold text-foreground">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Actions ── */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {orderId && (
          <Link
            href={`/my-orders/${orderId}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
          >
            <Package className="h-4 w-4" />
            View Order
          </Link>
        )}
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent active:scale-[0.98]"
        >
          <ShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Need help?{" "}
        <Link href="/" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
          Contact support
        </Link>
      </p>
    </main>
  );
}

/* ─── Page wrapper with Suspense for useSearchParams ──────────────── */

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
