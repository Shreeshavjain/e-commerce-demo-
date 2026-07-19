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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      {/* ── Success icon with pulse animation ── */}
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        {/* Decorative ring that pulses on mount */}
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100 [animation-duration:2s] [animation-iteration-count:3]" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
        Order Confirmed!
      </h1>

      <p className="max-w-lg text-lg font-medium leading-relaxed text-slate-500">
        Thank you for your purchase. Your payment has been verified and your order is being processed.
      </p>

      {/* ── Order ID badge ── */}
      {orderId && (
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Order ID</span>
          <span className="font-mono text-base font-black text-slate-900">
            {orderId.slice(-8).toUpperCase()}
          </span>
        </div>
      )}

      {/* ── What happens next ── */}
      <div className="mt-12 w-full max-w-md rounded-[2.5rem] border border-gray-100 bg-white p-8 text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">
          What happens next
        </p>
        <ul className="space-y-5">
          {[
            "You'll receive an order confirmation shortly",
            "Our team will prepare your items for shipping",
            "You'll receive tracking details once shipped",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-4 text-base font-medium text-slate-600">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Actions ── */}
      <div className="mt-12 flex flex-col gap-4 sm:flex-row w-full max-w-md">
        {orderId && (
          <Link
            href={`/my-orders/${orderId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Package className="h-5 w-5" />
            View Order
          </Link>
        )}
        <Link
          href="/products"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:bg-gray-50 active:scale-[0.98] shadow-sm"
        >
          <ShoppingBag className="h-5 w-5" />
          Continue Shopping
        </Link>
      </div>

      <p className="mt-12 text-sm font-medium text-slate-400">
        Need help?{" "}
        <Link href="/" className="font-bold text-slate-600 hover:text-blue-600 transition-colors">
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
