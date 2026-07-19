import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isAdminOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { getAdminOrderById, updateAdminOrderStatus } from "@/services/orders";
import { adminUpdateOrderStatusSchema } from "@/validations/admin-order";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

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

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const resolvedParams = await params;
  const orderId = resolvedParams.orderId?.trim();

  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    return NextResponse.json(createErrorResponse("Invalid order id"), { status: 400 });
  }

  try {
    const order = await getAdminOrderById(orderId);

    if (!order) {
      return NextResponse.json(createErrorResponse("Order not found"), { status: 404 });
    }

    return NextResponse.json(createSuccessResponse(order, "Order retrieved successfully"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch order";
    return NextResponse.json(createErrorResponse("Failed to retrieve order", message), { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const resolvedParams = await params;
  const orderId = resolvedParams.orderId?.trim();

  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    return NextResponse.json(createErrorResponse("Invalid order id"), { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = adminUpdateOrderStatusSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(createErrorResponse("Invalid payload", parsedBody.error.message), { status: 400 });
  }

  try {
    const result = await updateAdminOrderStatus(orderId, parsedBody.data.status);

    return NextResponse.json(
      createSuccessResponse(result, `Order status updated from ${result.previousStatus} to ${result.order.status}`)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order status";

    if (message === "Order not found") {
      return NextResponse.json(createErrorResponse("Order not found"), { status: 404 });
    }

    if (message.startsWith("Invalid status transition") || message === "Invalid order id") {
      return NextResponse.json(createErrorResponse("Invalid order status transition", message), { status: 400 });
    }

    return NextResponse.json(createErrorResponse("Failed to update order status", message), { status: 500 });
  }
}
