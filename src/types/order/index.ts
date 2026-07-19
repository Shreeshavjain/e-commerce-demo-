import type { Address } from "@/models/shared";

// ─── Cart item sent from the frontend to the create-order API ────────
// Only IDs and quantities travel from the client — the server recalculates prices from MongoDB.

export type CheckoutCartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

// ─── Shipping address as submitted by the checkout form ──────────────

export type CheckoutShippingAddress = {
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
};

// ─── Create order request / response ─────────────────────────────────

export type CreateOrderPayload = {
  items: CheckoutCartItem[];
  shippingAddress: CheckoutShippingAddress;
  notes?: string;
};

/** Returned by POST /api/orders/create-order on success. */
export type CreateOrderResponse = {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
};

// ─── Verify payment request / response ───────────────────────────────

export type VerifyPaymentPayload = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

/** Returned by POST /api/orders/verify-payment on success. */
export type VerifyPaymentResponse = {
  orderId: string;
  message: string;
};

// ─── Recalculated line item (server-side only, but typed here for reuse) ──

export type RecalculatedLineItem = {
  product: string;
  productName: string;
  productImage: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type RecalculatedCart = {
  items: RecalculatedLineItem[];
  subtotal: number;
  totalAmount: number;
};
