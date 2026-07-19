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
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  confirmed: { label: "Confirmed", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  processing: { label: "Processing", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  shipped: { label: "Shipped", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  refunded: { label: "Refunded", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  refunded: { label: "Refunded", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

function Badge({ config }: { config: { label: string; className: string } }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.className)}>
      {config.label}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="space-y-4 rounded-2xl border border-border p-5">
        <div className="h-4 w-24 rounded bg-muted" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex h-16 gap-4 rounded-lg bg-muted/40 p-3" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-2xl bg-muted" />
        <div className="h-40 rounded-2xl bg-muted" />
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
    const color = isCancelled ? "text-red-500" : "text-gray-500";

    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-5">
        <Icon className={cn("h-6 w-6", color)} />
        <span className={cn("text-sm font-semibold", color)}>{label}</span>
      </div>
    );
  }

  const currentIdx = statusIndex[status] ?? -1;

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Order Progress
      </p>

      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />

        {/* Progress line */}
        {currentIdx >= 0 && (
          <div
            className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, (currentIdx / (orderTimeline.length - 1)) * 100)}%`,
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
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-background text-muted-foreground/40",
                  isCurrent && "ring-4 ring-emerald-500/20"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-[11px] font-medium",
                  isCompleted ? "text-foreground" : "text-muted-foreground/50"
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
    <div className="rounded-2xl border border-border bg-card/80 p-5">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="space-y-0.5 text-sm text-foreground">
        <p className="font-medium">{address.fullName}</p>
        <p className="text-muted-foreground">{address.line1}</p>
        {address.line2 && <p className="text-muted-foreground">{address.line2}</p>}
        <p className="text-muted-foreground">
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="text-muted-foreground">{address.country}</p>
        {address.landmark && (
          <p className="text-muted-foreground">Landmark: {address.landmark}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">📞 {address.phoneNumber}</p>
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
    <div className="rounded-2xl border border-border bg-card/80 p-5">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Payment Summary
        </p>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium text-foreground">{fmt(order.subtotal)}</dd>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="font-medium text-emerald-600">-{fmt(order.discountAmount)}</dd>
          </div>
        )}
        {order.shippingFee > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="font-medium text-foreground">{fmt(order.shippingFee)}</dd>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="font-medium text-foreground">{fmt(order.taxAmount)}</dd>
          </div>
        )}
        <div className="border-t border-border pt-2">
          <div className="flex justify-between">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-semibold text-foreground">{fmt(order.totalAmount)}</dd>
          </div>
        </div>
      </dl>

      {order.paymentMethod && (
        <p className="mt-3 text-xs text-muted-foreground">
          Payment method: <span className="font-medium capitalize">{order.paymentMethod}</span>
        </p>
      )}
      {order.paidAt && (
        <p className="mt-1 text-xs text-muted-foreground">
          Paid on{" "}
          {new Date(order.paidAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
    className: "bg-muted text-muted-foreground",
  };

  const paymentCfg = paymentStatusConfig[currentOrder?.paymentStatus ?? ""] ?? {
    label: currentOrder?.paymentStatus ?? "",
    className: "bg-muted text-muted-foreground",
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href="/my-orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Orders
      </Link>

      {/* Auth gate */}
      {!user && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">Sign in to view order details</p>
        </div>
      )}

      {/* Loading */}
      {user && detailStatus === "loading" && <DetailSkeleton />}

      {/* Error */}
      {user && detailStatus === "error" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-foreground">Order not found</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {error ?? "We couldn't find this order. It may have been removed or you may not have access."}
          </p>
          <Link
            href="/my-orders"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      )}

      {/* Order detail content */}
      {user && detailStatus === "idle" && currentOrder && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Order #{currentOrder.id.slice(-8).toUpperCase()}
              </h1>
              <Badge config={orderStatusCfg} />
              <Badge config={paymentCfg} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{formattedDate}</p>
          </div>

          {/* Status timeline */}
          <StatusTimeline status={currentOrder.status} />

          {/* Items */}
          <div className="rounded-2xl border border-border bg-card/80 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Items ({currentOrder.items.length})
            </p>

            <div className="divide-y divide-border">
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
                  <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    {/* Image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-20">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.productName}
                      </p>

                      {(item.size || item.color) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-muted-foreground">
                        {unitAmount} × {item.quantity}
                      </p>
                    </div>

                    {/* Line total */}
                    <p className="shrink-0 text-sm font-semibold text-foreground">{lineAmount}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment + Address grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <PriceBreakdown order={currentOrder} />
            <AddressCard title="Shipping Address" address={currentOrder.shippingAddress} />
          </div>

          {/* Billing address (if different) */}
          {currentOrder.billingAddress && (
            <AddressCard title="Billing Address" address={currentOrder.billingAddress} />
          )}

          {/* Notes */}
          {currentOrder.notes && (
            <div className="rounded-2xl border border-border bg-card/80 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Order Notes
              </p>
              <p className="text-sm text-muted-foreground">{currentOrder.notes}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
