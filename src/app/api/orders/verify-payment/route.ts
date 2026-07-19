import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { createSuccessResponse, createErrorResponse } from "@/server/utils/api-response";
import { verifyPaymentSchema } from "@/validations/order";
import { verifyAndFulfillPayment } from "@/services/orders";

/**
 * POST /api/orders/verify-payment
 *
 * Flow:
 * 1. Authenticate the user via session cookie
 * 2. Validate the request body (razorpay IDs + signature)
 * 3. Verify HMAC SHA-256 signature to confirm the payment is genuine
 * 4. Find the pending order by razorpayOrderId + userId
 * 5. Mark order as paid and confirmed
 * 6. Deduct inventory atomically
 * 7. Return the order ID for the success page redirect
 */
export async function POST(request: Request) {
  // ── Auth gate ────────────────────────────────────────────────────
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json(
      createErrorResponse("You must be signed in to verify payment"),
      { status: 401 }
    );
  }

  // ── Body validation ──────────────────────────────────────────────
  const body = await request.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      createErrorResponse("Invalid payment verification payload", parsed.error.message),
      { status: 400 }
    );
  }

  // ── Verify and fulfill ──────────────────────────────────────────
  try {
    const result = await verifyAndFulfillPayment(parsed.data, currentUser.id);

    return NextResponse.json(
      createSuccessResponse(result, result.message)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed";

    // Signature failures are a security concern — return 400, not 500.
    const isSecurityError = message.includes("signature") || message.includes("tampering");

    return NextResponse.json(
      createErrorResponse("Payment verification failed", message),
      { status: isSecurityError ? 400 : 500 }
    );
  }
}
