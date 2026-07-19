import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { createSuccessResponse, createErrorResponse } from "@/server/utils/api-response";
import { createOrderSchema } from "@/validations/order";
import { createOrder } from "@/services/orders";
import { env } from "@/config/env";

/**
 * POST /api/orders/create-order
 *
 * Flow:
 * 1. Authenticate the user via session cookie
 * 2. Validate the request body (items + shipping address)
 * 3. Recalculate prices from MongoDB (never trust frontend)
 * 4. Check idempotency key to prevent duplicate orders
 * 5. Create a Razorpay order via their API
 * 6. Persist a pending Order document in MongoDB
 * 7. Return the data the frontend needs to open the Razorpay checkout modal
 */
export async function POST(request: Request) {
  // ── Auth gate ────────────────────────────────────────────────────
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json(
      createErrorResponse("You must be signed in to place an order"),
      { status: 401 }
    );
  }

  // ── Body validation ──────────────────────────────────────────────
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      createErrorResponse("Invalid order payload", parsed.error.message),
      { status: 400 }
    );
  }

  // ── Create the order ─────────────────────────────────────────────
  try {
    const result = await createOrder(parsed.data, currentUser.id);

    // The key_id is safe to send to the client — it's the same value as NEXT_PUBLIC_RAZORPAY_KEY_ID.
    const razorpayKeyId = env.RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      return NextResponse.json(
        createErrorResponse("Payment configuration is incomplete. Contact support."),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(
        {
          razorpayOrderId: result.razorpayOrderId,
          amount: result.amount,
          currency: result.currency,
          keyId: razorpayKeyId,
          orderId: result.orderId,
        },
        "Order created successfully"
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("[Create Order Error]:", error);
    
    const message = error instanceof Error ? error.message : "Unable to create order";

    // Surface stock/availability errors with 409 so the frontend can show a clear message.
    const isConflict =
      message.includes("Insufficient stock") ||
      message.includes("unavailable") ||
      message.includes("no longer available");

    return NextResponse.json(
      createErrorResponse(isConflict ? message : "Failed to create order", isConflict ? undefined : message),
      { status: isConflict ? 409 : 500 }
    );
  }
}
