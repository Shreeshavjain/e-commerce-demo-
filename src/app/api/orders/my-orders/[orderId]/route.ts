import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { createSuccessResponse, createErrorResponse } from "@/server/utils/api-response";
import { getUserOrderById } from "@/services/orders";

/**
 * GET /api/orders/my-orders/:orderId
 *
 * Returns the full details of a single order belonging to the authenticated user.
 * Ownership is enforced at the database query level — if the order doesn't belong
 * to this user, `getUserOrderById` returns null and we respond with 404.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // ── Auth gate ────────────────────────────────────────────────────
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json(
      createErrorResponse("You must be signed in to view order details"),
      { status: 401 }
    );
  }

  // ── Resolve dynamic param ───────────────────────────────────────
  const { orderId } = await params;

  if (!orderId || orderId.trim().length === 0) {
    return NextResponse.json(
      createErrorResponse("Order ID is required"),
      { status: 400 }
    );
  }

  // ── Fetch order ─────────────────────────────────────────────────
  try {
    const order = await getUserOrderById(currentUser.id, orderId);

    if (!order) {
      return NextResponse.json(
        createErrorResponse("Order not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(order, "Order retrieved successfully")
    );
  } catch (error) {
    console.error("[My Order Detail Error]:", error);

    return NextResponse.json(
      createErrorResponse("Failed to retrieve order details"),
      { status: 500 }
    );
  }
}
