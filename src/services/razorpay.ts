import Razorpay from "razorpay";
import crypto from "node:crypto";
import { env } from "@/config/env";

export type RazorpayPaymentSignature = {
  orderId: string;
  paymentId: string;
  signature: string;
};

let razorpayClient: Razorpay | null = null;

function getRazorpayCredentials() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Missing Razorpay environment variables");
  }

  console.log("[Razorpay Debug]:", {
    key_id: env.RAZORPAY_KEY_ID ? `${env.RAZORPAY_KEY_ID.substring(0, 8)}...` : undefined,
    has_key_secret: !!env.RAZORPAY_KEY_SECRET,
    key_id_undefined: env.RAZORPAY_KEY_ID === undefined,
    key_secret_undefined: env.RAZORPAY_KEY_SECRET === undefined,
  });

  return {
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  };
}

// A wrapper keeps payment initialization and verification in one place so future order code stays simple.
// Razorpay verification works by hashing the order and payment IDs with the secret key and comparing the result to the provider signature.
export function getRazorpayClient(): Razorpay {
  if (razorpayClient) {
    return razorpayClient;
  }

  razorpayClient = new Razorpay(getRazorpayCredentials());
  return razorpayClient;
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }: RazorpayPaymentSignature): boolean {
  const credentials = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac("sha256", credentials.key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

// ─── Razorpay order creation wrapper ─────────────────────────────────

export type RazorpayOrderParams = {
  /** Amount in paise (₹100 = 10000). */
  amount: number;
  /** A short receipt identifier stored by Razorpay for reconciliation. */
  receipt: string;
  /** Optional notes attached to the Razorpay order (max 15 key-value pairs). */
  notes?: Record<string, string>;
};

export type RazorpayOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
};

/**
 * Creates a Razorpay order with the given amount (in paise) and receipt.
 * This is the server-side call that generates the `order_id` the frontend
 * needs to open the Razorpay checkout modal.
 */
export async function createRazorpayOrder({ amount, receipt, notes }: RazorpayOrderParams): Promise<RazorpayOrderResponse> {
  const client = getRazorpayClient();

  const order = await client.orders.create({
    amount,
    currency: "INR",
    receipt,
    notes: notes ?? {},
  });

  return order as unknown as RazorpayOrderResponse;
}

export type { Razorpay };