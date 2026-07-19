"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";
import { useOrdersState, useOrdersActions } from "@/hooks/use-orders";

// ─── Status badge colors ─────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  confirmed: { label: "Confirmed", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  processing: { label: "Processing", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  shipped: { label: "Shipped", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  refunded: { label: "Refunded", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.className)}>
      {config.label}
    </span>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-xl bg-muted sm:h-20 sm:w-20" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-48 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="hidden h-8 w-20 rounded-full bg-muted sm:block" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60">
        <Package className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-foreground">No orders yet</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        When you place your first order, it will appear here. Start exploring our collection!
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
      >
        <ShoppingBag className="h-4 w-4" />
        Browse Products
      </Link>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────

function OrdersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Unauthenticated gate ────────────────────────────────────────────

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60">
        <Package className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-foreground">Sign in to view your orders</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Please sign in to access your order history and track your purchases.
      </p>
    </div>
  );
}

// ─── Order card ──────────────────────────────────────────────────────

function OrderCard({ order }: { order: import("@/types/order").OrderSummary }) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(order.totalAmount);

  return (
    <Link
      href={`/my-orders/${order.id}`}
      className="group block rounded-2xl border border-border bg-card/80 p-4 shadow-sm transition-all hover:border-primary/20 hover:bg-card hover:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-4">
        {/* Product thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-20">
          {order.firstItemImage ? (
            <Image
              src={order.firstItemImage}
              alt={order.firstItemName || "Order item"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium text-muted-foreground">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
          </div>

          <p className="mt-1.5 truncate text-sm font-medium text-foreground">
            {order.firstItemName}
            {order.itemCount > 1 && (
              <span className="text-muted-foreground"> +{order.itemCount - 1} more</span>
            )}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span className="hidden sm:inline">·</span>
            <span className="font-semibold text-foreground">{formattedAmount}</span>
          </div>
        </div>

        {/* Chevron */}
        <div className="hidden items-center self-center sm:flex">
          <ChevronRight className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/60" />
        </div>
      </div>
    </Link>
  );
}

// ─── Pagination controls ─────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition",
          page <= 1
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-accent active:scale-95"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition",
            p === page
              ? "bg-foreground text-background"
              : "border border-border hover:bg-accent active:scale-95"
          )}
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition",
          page >= totalPages
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-accent active:scale-95"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Page component ──────────────────────────────────────────────────

export default function MyOrdersPage() {
  const user = useAuthUser();
  const { orders, pagination, listStatus, error } = useOrdersState();
  const { fetchOrders } = useOrdersActions();

  useEffect(() => {
    if (user) {
      fetchOrders(1);
    }
  }, [user, fetchOrders]);

  const handlePageChange = (page: number) => {
    fetchOrders(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          My Orders
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Track and manage your purchase history
        </p>
      </div>

      {/* Auth gate */}
      {!user && <SignInPrompt />}

      {/* Loading skeletons */}
      {user && listStatus === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {user && listStatus === "error" && error && (
        <OrdersError
          message={error}
          onRetry={() => fetchOrders(pagination.page)}
        />
      )}

      {/* Empty state */}
      {user && listStatus === "idle" && orders.length === 0 && <EmptyOrders />}

      {/* Order list */}
      {user && listStatus === "idle" && orders.length > 0 && (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Showing {orders.length} of {pagination.total} order{pagination.total === 1 ? "" : "s"}
          </p>
        </>
      )}
    </main>
  );
}
