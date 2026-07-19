import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { OrderModel } from "@/models/order";
import type { PaymentStatus } from "@/models/constants";
import type {
  OrderSummary,
  OrderDetail,
  OrderDetailItem,
  SerializedAddress,
  PaginatedOrdersResponse,
} from "@/types/order";

// ─── Helpers ─────────────────────────────────────────────────────────

function serializeAddress(addr: Record<string, unknown> | null): SerializedAddress | null {
  if (!addr) return null;
  return {
    fullName: String(addr.fullName ?? ""),
    phoneNumber: String(addr.phoneNumber ?? ""),
    line1: String(addr.line1 ?? ""),
    line2: String(addr.line2 ?? ""),
    city: String(addr.city ?? ""),
    state: String(addr.state ?? ""),
    postalCode: String(addr.postalCode ?? ""),
    country: String(addr.country ?? ""),
    landmark: String(addr.landmark ?? ""),
  };
}

// ─── Get paginated orders for a user ─────────────────────────────────
// Only returns orders that have completed the payment flow (i.e. not
// abandoned Razorpay checkout attempts sitting in "pending" state).

export async function getUserOrders(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedOrdersResponse> {
  await connectToDatabase();

  const filter = {
    user: new Types.ObjectId(userId),
    paymentStatus: { $ne: "pending" as PaymentStatus },
  };

  const [total, orders] = await Promise.all([
    OrderModel.countDocuments(filter),
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const serialized: OrderSummary[] = orders.map((order) => {
    const items = (order.items ?? []) as unknown as Array<Record<string, unknown>>;
    const firstItem = items[0];

    return {
      id: order._id.toString(),
      status: String(order.status),
      paymentStatus: String(order.paymentStatus),
      paymentMethod: String(order.paymentMethod),
      totalAmount: Number(order.totalAmount),
      itemCount: items.length,
      firstItemImage: firstItem ? String(firstItem.productImage ?? "") : "",
      firstItemName: firstItem ? String(firstItem.productName ?? "") : "",
      createdAt: order.createdAt ? new Date(order.createdAt as string | number | Date).toISOString() : "",
    };
  });

  return {
    orders: serialized,
    pagination: { page, limit, total, totalPages },
  };
}

// ─── Get a single order by ID (with ownership check) ─────────────────
// The query filters by both _id and user so one user can never read
// another user's order — authorization is enforced at the data layer.

export async function getUserOrderById(
  userId: string,
  orderId: string
): Promise<OrderDetail | null> {
  if (!Types.ObjectId.isValid(orderId)) {
    return null;
  }

  await connectToDatabase();

  const order = await OrderModel.findOne({
    _id: new Types.ObjectId(orderId),
    user: new Types.ObjectId(userId),
  }).lean();

  if (!order) {
    return null;
  }

  const items: OrderDetailItem[] = ((order.items ?? []) as unknown as Array<Record<string, unknown>>).map((item) => ({
    product: item.product ? String(item.product) : "",
    productName: String(item.productName ?? ""),
    productImage: String(item.productImage ?? ""),
    size: String(item.size ?? ""),
    color: String(item.color ?? ""),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    lineTotal: Number(item.lineTotal ?? 0),
  }));

  const shippingAddress = serializeAddress(order.shippingAddress as Record<string, unknown>);
  const billingAddress = serializeAddress((order.billingAddress ?? null) as Record<string, unknown> | null);

  return {
    id: order._id.toString(),
    status: String(order.status),
    paymentStatus: String(order.paymentStatus),
    paymentMethod: String(order.paymentMethod),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount ?? 0),
    shippingFee: Number(order.shippingFee ?? 0),
    taxAmount: Number(order.taxAmount ?? 0),
    totalAmount: Number(order.totalAmount),
    notes: String(order.notes ?? ""),
    items,
    shippingAddress: shippingAddress!,
    billingAddress,
    paidAt: order.paidAt ? new Date(order.paidAt as string | number | Date).toISOString() : null,
    createdAt: order.createdAt ? new Date(order.createdAt as string | number | Date).toISOString() : "",
    updatedAt: order.updatedAt ? new Date(order.updatedAt as string | number | Date).toISOString() : "",
  };
}
