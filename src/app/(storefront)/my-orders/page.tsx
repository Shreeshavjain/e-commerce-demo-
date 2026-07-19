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
  pending: { label: "Pending", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  processing: { label: "Processing", className: "bg-violet-50 text-violet-600 border border-violet-200" },
  shipped: { label: "Shipped", className: "bg-sky-50 text-sky-600 border border-sky-200" },
  delivered: { label: "Delivered", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600 border border-red-200" },
  refunded: { label: "Refunded", className: "bg-gray-100 text-gray-600 border border-gray-200" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border border-gray-200" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", config.className)}>
      {config.label}
    </span>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[2rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]">
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 shrink-0 rounded-[1.25rem] bg-gray-100" />
        <div className="flex-1 space-y-4 py-2">
          <div className="h-4 w-32 rounded bg-gray-100" />
          <div className="h-5 w-48 rounded bg-gray-100" />
          <div className="h-4 w-24 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mt-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
        <Package className="h-8 w-8 text-slate-300" />
      </div>
      <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">No orders yet</h2>
      <p className="mt-2 max-w-sm text-base font-medium text-slate-500">
        When you place your first order, it will appear here. Start exploring our collection!
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95"
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
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mt-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-900 tracking-tight">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 transition hover:bg-gray-50 shadow-sm active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Unauthenticated gate ────────────────────────────────────────────

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] mt-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        <Package className="h-8 w-8 text-blue-300" />
      </div>
      <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">Sign in to view your orders</h2>
      <p className="mt-2 max-w-sm text-base font-medium text-slate-500">
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
      className="group block rounded-[2rem] border border-gray-100 bg-white p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] transition-all hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.08)] hover:-translate-y-0.5 sm:p-6"
    >
      <div className="flex items-start gap-5">
        {/* Product thumbnail */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-gray-50 border border-gray-100">
          {order.firstItemImage ? (
            <Image
              src={order.firstItemImage}
              alt={order.firstItemName || "Order item"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
          )}
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center h-20">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
          </div>

          <p className="truncate text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {order.firstItemName}
            {order.itemCount > 1 && (
              <span className="text-slate-500 font-medium ml-1">+{order.itemCount - 1} more</span>
            )}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 font-medium">
            <span>{formattedDate}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="font-black text-slate-900">{formattedAmount}</span>
          </div>
        </div>

        {/* Chevron */}
        <div className="hidden items-center self-center sm:flex h-20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-blue-50 group-hover:text-blue-600">
            <ChevronRight className="h-5 w-5" />
          </div>
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
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-all",
          page <= 1
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-gray-50 hover:border-gray-300 active:scale-95 text-slate-600"
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
            "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
            p === page
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 hover:border-gray-300 active:scale-95"
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
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-all",
          page >= totalPages
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-gray-50 hover:border-gray-300 active:scale-95 text-slate-600"
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
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 pt-32 min-h-screen">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
          Order History
        </h1>
        <p className="mt-2 text-base font-medium text-slate-500">
          Track and manage your past purchases
        </p>
      </div>

      {/* Auth gate */}
      {!user && <SignInPrompt />}

      {/* Loading skeletons */}
      {user && listStatus === "loading" && (
        <div className="space-y-4">
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
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />

          <p className="mt-6 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            Showing {orders.length} of {pagination.total} order{pagination.total === 1 ? "" : "s"}
          </p>
        </>
      )}
    </main>
  );
}
