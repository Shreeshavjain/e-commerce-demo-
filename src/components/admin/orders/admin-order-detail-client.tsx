"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  CircleDot,
  Truck,
  Package as PackageIcon,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { PaymentStatusBadge } from "@/components/admin/orders/payment-status-badge";
import { AdminOrderStatusControls } from "@/components/admin/orders/admin-order-status-controls";
import type { AdminOrderDetail } from "@/types/order";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const orderTimeline = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: CircleDot },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageIcon },
] as const;

const statusIndex: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function StatusTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";

  if (isCancelled || isRefunded) {
    const Icon = isCancelled ? XCircle : RotateCcw;
    const label = isCancelled ? "Order Cancelled" : "Order Refunded";
    const color = isCancelled ? "text-rose-500" : "text-zinc-500";

    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-5 mt-4">
        <Icon className={cn("h-6 w-6", color)} />
        <span className={cn("text-sm font-semibold", color)}>{label}</span>
      </div>
    );
  }

  const currentIdx = statusIndex[status] ?? -1;

  return (
    <div className="mt-4">
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
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all bg-card",
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border text-muted-foreground/40",
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
                  "mt-2 text-[11px] font-medium hidden sm:block",
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

type AdminOrderDetailClientProps = {
  initialOrder: AdminOrderDetail;
};

export function AdminOrderDetailClient({ initialOrder }: AdminOrderDetailClientProps) {
  const [order, setOrder] = useState<AdminOrderDetail>(initialOrder);

  const lineItemTotal = useMemo(
    () => order.items.reduce((sum, item) => sum + item.lineTotal, 0),
    [order.items]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Order details</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">#{order.id.slice(-10).toUpperCase()}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Placed on {formatDateTime(order.createdAt)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <PaymentStatusBadge status={order.paymentStatus} />
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="mt-5">
          <AdminOrderStatusControls
            orderId={order.id}
            currentStatus={order.status}
            onUpdated={(next) => setOrder(next)}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm shadow-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
          <div className="mt-3 space-y-1 text-sm text-foreground">
            <p className="font-semibold">{order.customer.name}</p>
            <p>{order.customer.email || "No email"}</p>
            <p>{order.customer.phoneNumber || "No phone"}</p>
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm shadow-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="font-medium text-foreground capitalize">{order.paymentMethod}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Razorpay order ID</dt>
              <dd className="max-w-[60%] truncate font-mono text-xs text-foreground">{order.razorpayOrderId || "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Razorpay payment ID</dt>
              <dd className="max-w-[60%] truncate font-mono text-xs text-foreground">{order.razorpayPaymentId || "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Paid at</dt>
              <dd className="font-medium text-foreground">{formatDateTime(order.paidAt)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm shadow-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Shipping address</p>
          <div className="mt-3 text-sm text-foreground">
            <p className="font-semibold">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phoneNumber}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            {order.shippingAddress.landmark ? <p className="text-muted-foreground">Landmark: {order.shippingAddress.landmark}</p> : null}
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm shadow-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Timeline</p>
          <StatusTimeline status={order.status} />
          
          <div className="mt-6 space-y-3">
            {order.timeline.map((event) => (
              <div key={event.key} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-semibold text-foreground">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(event.at)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Variant</th>
                <th className="py-3 pr-4">Qty</th>
                <th className="py-3 pr-4">Unit price</th>
                <th className="py-3">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((item, index) => (
                <tr key={`${item.product}-${index}`}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PackageIcon className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-foreground">{item.productName}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {item.color} {item.size ? `/ ${item.size}` : ""}
                  </td>
                  <td className="py-3 pr-4 text-foreground">{item.quantity}</td>
                  <td className="py-3 pr-4 text-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 font-medium text-foreground">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-2 rounded-2xl border border-border bg-background/80 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Items total</span>
            <span className="font-medium text-foreground">{formatCurrency(lineItemTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium text-emerald-600">-{formatCurrency(order.discountAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">{formatCurrency(order.shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium text-foreground">{formatCurrency(order.taxAmount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-base">
            <span className="font-semibold text-foreground">Grand total</span>
            <span className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm shadow-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notes</p>
        <p className="mt-3 text-sm leading-6 text-foreground">{order.notes || "No notes were added for this order."}</p>
      </section>
    </div>
  );
}
