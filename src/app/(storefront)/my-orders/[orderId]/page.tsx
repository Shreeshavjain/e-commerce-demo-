"use client";

import { useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  CircleDot,
  XCircle,
  RotateCcw,
  MapPin,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";
import { useOrderDetailState, useOrdersActions } from "@/hooks/use-orders";
import type { OrderDetail, SerializedAddress } from "@/types/order";

// ─── Status timeline config ──────────────────────────────────────────

const orderTimeline = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: CircleDot },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
] as const;

const statusIndex: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  processing: { label: "Processing", className: "bg-violet-50 text-violet-600 border border-violet-200" },
  shipped: { label: "Shipped", className: "bg-sky-50 text-sky-600 border border-sky-200" },
  delivered: { label: "Delivered", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600 border border-red-200" },
  refunded: { label: "Refunded", className: "bg-gray-100 text-gray-600 border border-gray-200" },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-600 border border-red-200" },
  refunded: { label: "Refunded", className: "bg-gray-100 text-gray-600 border border-gray-200" },
};

function Badge({ config }: { config: { label: string; className: string } }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider", config.className)}>
      {config.label}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8 mt-8">
      <div className="h-10 w-64 rounded bg-gray-100" />
      <div className="space-y-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-4 w-32 rounded bg-gray-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex h-20 gap-5 rounded-[1.25rem] bg-gray-50 p-4" />
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-48 rounded-[2rem] bg-gray-100" />
        <div className="h-48 rounded-[2rem] bg-gray-100" />
      </div>
    </div>
  );
}

// ─── Status timeline ─────────────────────────────────────────────────

function StatusTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";

  if (isCancelled || isRefunded) {
    const Icon = isCancelled ? XCircle : RotateCcw;
    const label = isCancelled ? "Order Cancelled" : "Order Refunded";
    const color = isCancelled ? "text-red-500 bg-red-50" : "text-slate-500 bg-slate-50";

    return (
      <div className="flex items-center gap-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", color)}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-base font-black text-slate-900">{label}</span>
      </div>
    );
  }

  const currentIdx = statusIndex[status] ?? -1;

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]">
      <p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
        Order Progress
      </p>

      <div className="relative flex items-center justify-between px-4">
        {/* Background line */}
        <div className="absolute left-10 right-10 top-1/2 h-1 -translate-y-1/2 bg-gray-100 rounded-full" />

        {/* Progress line */}
        {currentIdx >= 0 && (
          <div
            className="absolute left-10 top-1/2 h-1 -translate-y-1/2 bg-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `calc(${Math.min(100, (currentIdx / (orderTimeline.length - 1)) * 100)}% - 5rem)`,
            }}
          />
        )}

        {orderTimeline.map((step, i) => {
          const isCompleted = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-500",
                  isCompleted
                    ? "border-blue-100 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "border-white bg-gray-100 text-slate-300",
                  isCurrent && "scale-110 ring-4 ring-blue-50"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "mt-3 text-xs font-bold transition-colors duration-300",
                  isCompleted ? "text-slate-900" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Address card ────────────────────────────────────────────────────

function AddressCard({ title, address }: { title: string; address: SerializedAddress }) {
  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] transition-all hover:border-gray-200">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <MapPin className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
      </div>
      <div className="space-y-1.5 text-sm text-slate-500 font-medium pl-1">
        <p className="font-bold text-slate-900 text-base">{address.fullName}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{address.country}</p>
        {address.landmark && (
          <p>Landmark: {address.landmark}</p>
        )}
        <p className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
          📞 {address.phoneNumber}
        </p>
      </div>
    </div>
  );
}

// ─── Price breakdown ─────────────────────────────────────────────────

function PriceBreakdown({ order }: { order: OrderDetail }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] transition-all hover:border-gray-200">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <CreditCard className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Payment Summary
        </p>
      </div>

      <dl className="space-y-3 text-sm font-medium">
        <div className="flex justify-between items-center">
          <dt className="text-slate-500">Subtotal</dt>
          <dd className="text-slate-900">{fmt(order.subtotal)}</dd>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between items-center">
            <dt className="text-slate-500">Discount</dt>
            <dd className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">-{fmt(order.discountAmount)}</dd>
          </div>
        )}
        {order.shippingFee > 0 && (
          <div className="flex justify-between items-center">
            <dt className="text-slate-500">Shipping</dt>
            <dd className="text-slate-900">{fmt(order.shippingFee)}</dd>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between items-center">
            <dt className="text-slate-500">Tax</dt>
            <dd className="text-slate-900">{fmt(order.taxAmount)}</dd>
          </div>
        )}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <dt className="font-bold text-slate-900 text-base">Total</dt>
            <dd className="font-black text-slate-900 text-lg">{fmt(order.totalAmount)}</dd>
          </div>
        </div>
      </dl>

      {order.paymentMethod && (
        <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Method: <span className="text-slate-900 ml-1">{order.paymentMethod}</span>
        </p>
      )}
      {order.paidAt && (
        <p className="mt-2 text-xs font-medium text-slate-400">
          Paid on{" "}
          <span className="text-slate-600">
            {new Date(order.paidAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </p>
      )}
    </div>
  );
}

// ─── Page component ──────────────────────────────────────────────────

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const user = useAuthUser();
  const { currentOrder, detailStatus, error } = useOrderDetailState();
  const { fetchOrderById } = useOrdersActions();

  useEffect(() => {
    if (user && orderId) {
      fetchOrderById(orderId);
    }
  }, [user, orderId, fetchOrderById]);

  const formattedDate = currentOrder?.createdAt
    ? new Date(currentOrder.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const orderStatusCfg = statusConfig[currentOrder?.status ?? ""] ?? {
    label: currentOrder?.status ?? "",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  const paymentCfg = paymentStatusConfig[currentOrder?.paymentStatus ?? ""] ?? {
    label: currentOrder?.paymentStatus ?? "",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 pt-32 min-h-screen">
      {/* Breadcrumb */}
      <Link
        href="/my-orders"
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-gray-50 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Orders
      </Link>

      {/* Auth gate */}
      {!user && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] bg-white border border-gray-100 mt-8 shadow-sm">
          <Clock className="h-12 w-12 text-slate-300" />
          <p className="mt-6 text-xl font-black text-slate-900">Sign in to view order details</p>
        </div>
      )}

      {/* Loading */}
      {user && detailStatus === "loading" && <DetailSkeleton />}

      {/* Error */}
      {user && detailStatus === "error" && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] bg-white border border-gray-100 mt-8 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="mt-6 text-2xl font-black text-slate-900">Order not found</h2>
          <p className="mt-2 max-w-sm text-base font-medium text-slate-500">
            {error ?? "We couldn't find this order. It may have been removed or you may not have access."}
          </p>
          <Link
            href="/my-orders"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      )}

      {/* Order detail content */}
      {user && detailStatus === "idle" && currentOrder && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">
                Order #{currentOrder.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-base font-medium text-slate-500">{formattedDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge config={orderStatusCfg} />
              <Badge config={paymentCfg} />
            </div>
          </div>

          {/* Status timeline */}
          <StatusTimeline status={currentOrder.status} />

          {/* Items */}
          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Items ({currentOrder.items.length})
            </p>

            <div className="divide-y divide-gray-100">
              {currentOrder.items.map((item, i) => {
                const lineAmount = new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(item.lineTotal);

                const unitAmount = new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(item.unitPrice);

                return (
                  <div key={i} className="flex items-center gap-5 py-5 first:pt-0 last:pb-0 group">
                    {/* Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-gray-50 border border-gray-100 flex items-center justify-center">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="80px"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-slate-300" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.productName}
                      </p>

                      {(item.size || item.color) && (
                        <p className="mt-0.5 text-sm font-medium text-slate-500">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      <p className="mt-1 text-sm font-semibold text-slate-400">
                        {unitAmount} <span className="font-medium mx-1">×</span> {item.quantity}
                      </p>
                    </div>

                    {/* Line total */}
                    <p className="shrink-0 text-lg font-black text-slate-900">{lineAmount}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment + Address grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <PriceBreakdown order={currentOrder} />
            <AddressCard title="Shipping Address" address={currentOrder.shippingAddress} />
          </div>

          {/* Billing address (if different) */}
          {currentOrder.billingAddress && (
            <AddressCard title="Billing Address" address={currentOrder.billingAddress} />
          )}

          {/* Notes */}
          {currentOrder.notes && (
            <div className="rounded-[2rem] border border-gray-100 bg-gray-50/50 p-6 sm:p-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Order Notes
              </p>
              <p className="text-base font-medium text-slate-700 leading-relaxed italic border-l-4 border-blue-500 pl-4">{currentOrder.notes}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
