"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import type { CheckoutShippingAddress, CreateOrderResponse } from "@/types/order";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/server/utils/api-response";

// ─── Razorpay global type ────────────────────────────────────────────
// The Razorpay checkout.js script attaches itself to `window.Razorpay`.

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

// ─── Script loader ───────────────────────────────────────────────────
// Razorpay's checkout.js is loaded lazily — only when the user actually
// initiates payment. This avoids loading a 40KB script on every page.

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// ─── Hook state ──────────────────────────────────────────────────────

export type CheckoutStep = "idle" | "creating-order" | "awaiting-payment" | "verifying" | "success" | "error";

export type UseRazorpayCheckoutOptions = {
  /** User display name for Razorpay prefill. */
  userName?: string;
  /** User email for Razorpay prefill. */
  userEmail?: string;
  /** User phone for Razorpay prefill. */
  userPhone?: string;
};

export function useRazorpayCheckout(options: UseRazorpayCheckoutOptions = {}) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [error, setError] = useState<string | null>(null);

  // Guard against state updates after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const isProcessing = step !== "idle" && step !== "error" && step !== "success";

  // ── Main checkout handler ────────────────────────────────────────
  const initiateCheckout = useCallback(
    async (
      items: Array<{ productId: string; variantId: string; quantity: number }>,
      shippingAddress: CheckoutShippingAddress,
      notes?: string
    ) => {
      if (isProcessing) return;

      setStep("creating-order");
      setError(null);

      try {
        // 1. Load the Razorpay checkout script if not already loaded.
        await loadRazorpayScript();

        // 2. Call our create-order API to get the Razorpay order_id.
        const createRes = await fetch("/api/orders/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, shippingAddress, notes }),
        });

        const createData: ApiSuccessResponse<CreateOrderResponse> | ApiErrorResponse =
          await createRes.json();

        if (!createData.success) {
          throw new Error(createData.message || "Failed to create order");
        }

        const { razorpayOrderId, amount, currency, keyId } = createData.data;

        // 3. Open the Razorpay checkout modal.
        if (!mountedRef.current) return;
        setStep("awaiting-payment");

        const RazorpayConstructor = window.Razorpay;
        if (!RazorpayConstructor) {
          throw new Error("Razorpay SDK not loaded");
        }

        const rzp = new RazorpayConstructor({
          key: keyId,
          amount: Math.round(amount * 100), // Razorpay expects paise
          currency,
          name: "Ecommerce Store",
          description: "Order Payment",
          order_id: razorpayOrderId,
          prefill: {
            name: options.userName,
            email: options.userEmail,
            contact: options.userPhone,
          },
          theme: { color: "#18181b" },
          handler: async (response: RazorpaySuccessResponse) => {
            // 4. Payment succeeded — verify the signature on our server.
            if (!mountedRef.current) return;
            setStep("verifying");

            try {
              const verifyRes = await fetch("/api/orders/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();

              if (!verifyData.success) {
                throw new Error(verifyData.message || "Payment verification failed");
              }

              // 5. Verification passed — clear cart and redirect.
              if (!mountedRef.current) return;
              setStep("success");
              clearCart();
              toast.success("Payment successful! Your order is confirmed.");
              router.push(`/order-success?orderId=${verifyData.data.orderId}`);
            } catch (verifyError) {
              if (!mountedRef.current) return;
              const msg = verifyError instanceof Error ? verifyError.message : "Payment verification failed";
              setStep("error");
              setError(msg);
              toast.error(msg);
            }
          },
          modal: {
            ondismiss: () => {
              // User closed the Razorpay modal without completing payment.
              if (!mountedRef.current) return;
              setStep("idle");
              toast.info("Payment was cancelled. Your order is saved as pending.");
            },
          },
        });

        rzp.open();
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : "Something went wrong during checkout";
        setStep("error");
        setError(msg);
        toast.error(msg);
      }
    },
    [isProcessing, clearCart, router, options.userName, options.userEmail, options.userPhone]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return {
    step,
    error,
    isProcessing,
    initiateCheckout,
    reset,
  };
}
