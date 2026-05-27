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

export type { Razorpay };