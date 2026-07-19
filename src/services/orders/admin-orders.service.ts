import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { OrderModel } from "@/models/order";
import { UserModel } from "@/models/user";
import type { OrderStatus } from "@/models/constants";
import {
  adminAllowedStatusTargets,
  type AdminOrderDetail,
  type AdminOrderFilters,
  type AdminOrderTimelineEvent,
  type AdminOrderSummary,
  type PaginatedAdminOrdersResponse,
  type SerializedAddress,
} from "@/types/order";
import type { AdminManageableOrderStatus } from "@/validations/admin-order";

type PopulatedUser = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  phoneNumber?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeAddress(addr: Record<string, unknown> | null): SerializedAddress | null {
  if (!addr) {
    return null;
  }

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

function toIsoDate(value: unknown): string {
  if (!value) {
    return "";
  }

  return new Date(value as string | number | Date).toISOString();
}

function buildTimeline(order: Record<string, unknown>): AdminOrderTimelineEvent[] {
  const timeline: AdminOrderTimelineEvent[] = [];

  if (order.createdAt) {
    timeline.push({
      key: "created",
      label: "Order Created",
      at: toIsoDate(order.createdAt),
      description: "Order was created by the customer.",
    });
  }

  if (order.paidAt) {
    timeline.push({
      key: "paid",
      label: "Payment Captured",
      at: toIsoDate(order.paidAt),
      description: `Payment marked as ${String(order.paymentStatus ?? "paid")}.`,
    });
  }

  if (order.updatedAt) {
    timeline.push({
      key: "status",
      label: "Latest Status",
      at: toIsoDate(order.updatedAt),
      description: `Order status is ${String(order.status ?? "pending")}.`,
    });
  }

  return timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function getAllowedStatusTargets(status: OrderStatus): OrderStatus[] {
  return adminAllowedStatusTargets[status] ?? [];
}

export function isValidAdminOrderStatusTransition(currentStatus: OrderStatus, nextStatus: AdminManageableOrderStatus): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return getAllowedStatusTargets(currentStatus).includes(nextStatus);
}

export async function listAdminOrders(filters: AdminOrderFilters): Promise<PaginatedAdminOrdersResponse> {
  await connectToDatabase();

  const page = Math.max(1, filters.page);
  const limit = Math.min(Math.max(filters.limit, 1), 50);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> & { $or?: Array<Record<string, unknown>> } = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  if (filters.fromDate || filters.toDate) {
    const createdAt: Record<string, Date> = {};

    if (filters.fromDate) {
      createdAt.$gte = new Date(`${filters.fromDate}T00:00:00.000Z`);
    }

    if (filters.toDate) {
      createdAt.$lte = new Date(`${filters.toDate}T23:59:59.999Z`);
    }

    query.createdAt = createdAt;
  }

  if (filters.search) {
    const escapedSearch = escapeRegExp(filters.search);
    const regex = new RegExp(escapedSearch, "i");
    const userMatches = await UserModel.find(
      {
        $or: [
          { name: regex },
          { email: regex },
          { phoneNumber: regex },
        ],
      },
      { _id: 1 }
    )
      .limit(100)
      .lean();

    const userIds = userMatches.map((user) => user._id);

    query.$or = [
      { razorpayOrderId: regex },
      { razorpayPaymentId: regex },
      { notes: regex },
      ...(Types.ObjectId.isValid(filters.search) ? [{ _id: new Types.ObjectId(filters.search) }] : []),
      ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
    ];
  }

  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

  const [total, orders] = await Promise.all([
    OrderModel.countDocuments(query),
    OrderModel.find(query)
      .sort({ [filters.sortBy]: sortDirection, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email phoneNumber")
      .lean(),
  ]);

  const serializedOrders: AdminOrderSummary[] = orders.map((order) => {
    const user = (order.user ?? null) as PopulatedUser | null;
    const items = (order.items ?? []) as unknown as Array<Record<string, unknown>>;

    return {
      id: order._id.toString(),
      customerName: String(user?.name ?? "Unknown"),
      customerEmail: String(user?.email ?? ""),
      customerPhone: String(user?.phoneNumber ?? ""),
      totalAmount: Number(order.totalAmount ?? 0),
      paymentStatus: String(order.paymentStatus ?? "pending") as AdminOrderSummary["paymentStatus"],
      orderStatus: String(order.status ?? "pending") as AdminOrderSummary["orderStatus"],
      createdAt: toIsoDate(order.createdAt),
      itemCount: items.length,
    };
  });

  return {
    orders: serializedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    appliedFilters: {
      search: filters.search ?? "",
      status: filters.status ?? "all",
      paymentStatus: filters.paymentStatus ?? "all",
      fromDate: filters.fromDate ?? "",
      toDate: filters.toDate ?? "",
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
  };
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
  if (!Types.ObjectId.isValid(orderId)) {
    return null;
  }

  await connectToDatabase();

  const order = await OrderModel.findById(orderId)
    .populate("user", "name email phoneNumber")
    .lean();

  if (!order) {
    return null;
  }

  const user = (order.user ?? null) as PopulatedUser | null;
  const items = ((order.items ?? []) as unknown as Array<Record<string, unknown>>).map((item) => ({
    product: item.product ? String(item.product) : "",
    productName: String(item.productName ?? ""),
    productImage: String(item.productImage ?? ""),
    size: String(item.size ?? ""),
    color: String(item.color ?? ""),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    lineTotal: Number(item.lineTotal ?? 0),
  }));

  return {
    id: order._id.toString(),
    customer: {
      id: user?._id?.toString() ?? "",
      name: String(user?.name ?? "Unknown"),
      email: String(user?.email ?? ""),
      phoneNumber: String(user?.phoneNumber ?? ""),
    },
    shippingAddress: serializeAddress(order.shippingAddress as Record<string, unknown>)!,
    billingAddress: serializeAddress((order.billingAddress ?? null) as Record<string, unknown> | null),
    items,
    subtotal: Number(order.subtotal ?? 0),
    discountAmount: Number(order.discountAmount ?? 0),
    shippingFee: Number(order.shippingFee ?? 0),
    taxAmount: Number(order.taxAmount ?? 0),
    totalAmount: Number(order.totalAmount ?? 0),
    paymentMethod: String(order.paymentMethod ?? ""),
    paymentStatus: String(order.paymentStatus ?? "pending") as AdminOrderDetail["paymentStatus"],
    razorpayOrderId: String(order.razorpayOrderId ?? ""),
    razorpayPaymentId: String(order.razorpayPaymentId ?? ""),
    paidAt: order.paidAt ? toIsoDate(order.paidAt) : null,
    status: String(order.status ?? "pending") as AdminOrderDetail["status"],
    notes: String(order.notes ?? ""),
    timeline: buildTimeline(order as unknown as Record<string, unknown>),
    createdAt: toIsoDate(order.createdAt),
    updatedAt: toIsoDate(order.updatedAt),
  };
}

export async function updateAdminOrderStatus(orderId: string, nextStatus: AdminManageableOrderStatus): Promise<{
  order: AdminOrderDetail;
  previousStatus: OrderStatus;
}> {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order id");
  }

  await connectToDatabase();

  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const currentStatus = order.status as OrderStatus;

  if (!isValidAdminOrderStatusTransition(currentStatus, nextStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} -> ${nextStatus}`);
  }

  if (currentStatus !== nextStatus) {
    order.status = nextStatus;
    await order.save();
  }

  const updatedOrder = await getAdminOrderById(orderId);

  if (!updatedOrder) {
    throw new Error("Order not found");
  }

  return {
    order: updatedOrder,
    previousStatus: currentStatus,
  };
}
