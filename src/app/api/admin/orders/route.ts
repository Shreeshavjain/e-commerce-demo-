import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isAdminOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { listAdminOrders } from "@/services/orders";
import { adminOrderListQuerySchema } from "@/validations/admin-order";
import type { AdminOrderFilters } from "@/types/order";

async function ensureAdminAccess() {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return { error: NextResponse.json(createErrorResponse("You must be signed in"), { status: 401 }) };
  }

  if (!isAdminOrAbove(currentUser)) {
    return { error: NextResponse.json(createErrorResponse("You do not have permission to manage orders"), { status: 403 }) };
  }

  return { currentUser };
}

export async function GET(request: NextRequest) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const queryInput = {
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
    sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    paymentStatus: request.nextUrl.searchParams.get("paymentStatus") ?? undefined,
    fromDate: request.nextUrl.searchParams.get("fromDate") ?? undefined,
    toDate: request.nextUrl.searchParams.get("toDate") ?? undefined,
  };

  const parsedQuery = adminOrderListQuerySchema.safeParse(queryInput);

  if (!parsedQuery.success) {
    return NextResponse.json(createErrorResponse("Invalid order query", parsedQuery.error.message), { status: 400 });
  }

  const filters: AdminOrderFilters = {
    page: parsedQuery.data.page,
    limit: parsedQuery.data.limit,
    search: parsedQuery.data.search || undefined,
    sortBy: parsedQuery.data.sortBy,
    sortOrder: parsedQuery.data.sortOrder,
    status: parsedQuery.data.status && parsedQuery.data.status !== "all" ? parsedQuery.data.status : undefined,
    paymentStatus:
      parsedQuery.data.paymentStatus && parsedQuery.data.paymentStatus !== "all"
        ? parsedQuery.data.paymentStatus
        : undefined,
    fromDate: parsedQuery.data.fromDate,
    toDate: parsedQuery.data.toDate,
  };

  try {
    const result = await listAdminOrders(filters);

    return NextResponse.json(createSuccessResponse(result, "Orders retrieved successfully"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch orders";
    return NextResponse.json(createErrorResponse("Failed to retrieve orders", message), { status: 500 });
  }
}
