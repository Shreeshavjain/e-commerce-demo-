import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { createSuccessResponse, createErrorResponse } from "@/server/utils/api-response";
import { getUserOrders } from "@/services/orders";

/**
 * GET /api/orders/my-orders?page=1&limit=10
 *
 * Returns a paginated list of the authenticated user's completed orders.
 * Pending (abandoned) checkout attempts are excluded.
 */
export async function GET(request: NextRequest) {
  // ── Auth gate ────────────────────────────────────────────────────
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json(
      createErrorResponse("You must be signed in to view your orders"),
      { status: 401 }
    );
  }

  // ── Query params ────────────────────────────────────────────────
  const searchParams = request.nextUrl.searchParams;

  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? "10");

  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw >= 1 && limitRaw <= 50 ? Math.floor(limitRaw) : 10;

  // ── Fetch orders ────────────────────────────────────────────────
  try {
    const result = await getUserOrders(currentUser.id, page, limit);

    return NextResponse.json(
      createSuccessResponse(result, "Orders retrieved successfully")
    );
  } catch (error) {
    console.error("[My Orders List Error]:", error);

    return NextResponse.json(
      createErrorResponse("Failed to retrieve orders"),
      { status: 500 }
    );
  }
}
