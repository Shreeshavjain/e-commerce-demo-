import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Search, ShoppingBag } from "lucide-react";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isAdminOrAbove } from "@/server/auth/role-guards";
import { listAdminOrders } from "@/services/orders";
import { adminOrderListQuerySchema } from "@/validations/admin-order";
import { orderStatuses, paymentStatuses } from "@/models/constants";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { PaymentStatusBadge } from "@/components/admin/orders/payment-status-badge";

type AdminOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildPageHref(baseFilters: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseFilters);

  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  const queryString = params.toString();
  return queryString ? `/admin/orders?${queryString}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser || !isAdminOrAbove(currentUser)) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const queryInput = {
    page: getQueryValue(resolvedSearchParams.page),
    limit: getQueryValue(resolvedSearchParams.limit),
    search: getQueryValue(resolvedSearchParams.search),
    sortBy: getQueryValue(resolvedSearchParams.sortBy),
    sortOrder: getQueryValue(resolvedSearchParams.sortOrder),
    status: getQueryValue(resolvedSearchParams.status),
    paymentStatus: getQueryValue(resolvedSearchParams.paymentStatus),
    fromDate: getQueryValue(resolvedSearchParams.fromDate),
    toDate: getQueryValue(resolvedSearchParams.toDate),
  };

  const parsedQuery = adminOrderListQuerySchema.safeParse(queryInput);

  const validatedQuery = parsedQuery.success
    ? parsedQuery.data
    : {
        page: 1,
        limit: 10,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        search: "",
        status: "all" as const,
        paymentStatus: "all" as const,
        fromDate: "",
        toDate: "",
      };

  const result = await listAdminOrders({
    page: validatedQuery.page,
    limit: validatedQuery.limit,
    search: validatedQuery.search || undefined,
    sortBy: validatedQuery.sortBy,
    sortOrder: validatedQuery.sortOrder,
    status: validatedQuery.status && validatedQuery.status !== "all" ? validatedQuery.status : undefined,
    paymentStatus:
      validatedQuery.paymentStatus && validatedQuery.paymentStatus !== "all" ? validatedQuery.paymentStatus : undefined,
    fromDate: validatedQuery.fromDate || undefined,
    toDate: validatedQuery.toDate || undefined,
  });

  const showingStart = result.pagination.total === 0 ? 0 : (result.pagination.page - 1) * result.pagination.limit + 1;
  const showingEnd = Math.min(result.pagination.page * result.pagination.limit, result.pagination.total);

  const baseFilters = new URLSearchParams();
  if (validatedQuery.search) baseFilters.set("search", validatedQuery.search);
  if (validatedQuery.status && validatedQuery.status !== "all") baseFilters.set("status", validatedQuery.status);
  if (validatedQuery.paymentStatus && validatedQuery.paymentStatus !== "all") {
    baseFilters.set("paymentStatus", validatedQuery.paymentStatus);
  }
  if (validatedQuery.sortBy && validatedQuery.sortBy !== "createdAt") baseFilters.set("sortBy", validatedQuery.sortBy);
  if (validatedQuery.sortOrder && validatedQuery.sortOrder !== "desc") baseFilters.set("sortOrder", validatedQuery.sortOrder);
  if (validatedQuery.fromDate) baseFilters.set("fromDate", validatedQuery.fromDate);
  if (validatedQuery.toDate) baseFilters.set("toDate", validatedQuery.toDate);
  if (validatedQuery.limit !== 10) baseFilters.set("limit", String(validatedQuery.limit));

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_45%)]" />

      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-4 rounded-[2rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Admin dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Order management</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Search, filter, and manage order lifecycles with secure admin-only controls.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-background/85 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              <p className="text-sm">Total orders</p>
            </div>
            <p className="mt-2 text-3xl font-semibold text-foreground">{result.pagination.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">Showing {showingStart}-{showingEnd}</p>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
          <form method="get" className="grid gap-3 lg:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))]">
            <label className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                name="search"
                defaultValue={validatedQuery.search ?? ""}
                placeholder="Search order, Razorpay ID, customer"
                className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>

            <select
              name="status"
              defaultValue={validatedQuery.status ?? "all"}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
            >
              <option value="all">All statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              name="paymentStatus"
              defaultValue={validatedQuery.paymentStatus ?? "all"}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
            >
              <option value="all">All payments</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="fromDate"
              defaultValue={validatedQuery.fromDate ?? ""}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
            />

            <input
              type="date"
              name="toDate"
              defaultValue={validatedQuery.toDate ?? ""}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Filter className="h-4 w-4" />
                Apply
              </button>
              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
              >
                Reset
              </Link>
            </div>

            <input type="hidden" name="sortBy" value={validatedQuery.sortBy} />
            <input type="hidden" name="sortOrder" value={validatedQuery.sortOrder} />
            <input type="hidden" name="limit" value={String(validatedQuery.limit)} />
          </form>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Page {result.pagination.page} of {result.pagination.totalPages}
            </div>

            <form method="get" className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="search" value={validatedQuery.search ?? ""} />
              <input type="hidden" name="status" value={validatedQuery.status ?? "all"} />
              <input type="hidden" name="paymentStatus" value={validatedQuery.paymentStatus ?? "all"} />
              <input type="hidden" name="fromDate" value={validatedQuery.fromDate ?? ""} />
              <input type="hidden" name="toDate" value={validatedQuery.toDate ?? ""} />

              <select
                name="sortBy"
                defaultValue={validatedQuery.sortBy}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs outline-none"
              >
                <option value="createdAt">Sort: Created date</option>
                <option value="totalAmount">Sort: Total amount</option>
                <option value="status">Sort: Order status</option>
                <option value="paymentStatus">Sort: Payment status</option>
              </select>

              <select
                name="sortOrder"
                defaultValue={validatedQuery.sortOrder}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs outline-none"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-secondary"
              >
                Update sort
              </button>
            </form>
          </div>

          {result.orders.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-background/70 p-10 text-center">
              <p className="text-lg font-semibold text-foreground">No orders found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting filters or searching with a broader term.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
                <table className="w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/35 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {result.orders.map((order) => (
                      <tr key={order.id} className="align-top">
                        <td className="px-4 py-3 font-medium text-foreground">#{order.id.slice(-8).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail || "No email"}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{order.customerPhone || "-"}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                        <td className="px-4 py-3"><OrderStatusBadge status={order.orderStatus} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {result.orders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm shadow-black/5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-secondary"
                      >
                        Details
                      </Link>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerEmail || "No email"}</p>
                    <p className="text-xs text-muted-foreground">{order.customerPhone || "No phone"}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <PaymentStatusBadge status={order.paymentStatus} />
                      <OrderStatusBadge status={order.orderStatus} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <p>Total: <span className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span></p>
                      <p>Items: <span className="font-semibold text-foreground">{order.itemCount}</span></p>
                      <p className="col-span-2">Created: <span className="font-semibold text-foreground">{formatDate(order.createdAt)}</span></p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {result.pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
              <Link
                href={buildPageHref(baseFilters, Math.max(1, result.pagination.page - 1))}
                aria-disabled={result.pagination.page <= 1}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 transition",
                  result.pagination.page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-secondary"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>

              <span>
                Page {result.pagination.page} of {result.pagination.totalPages}
              </span>

              <Link
                href={buildPageHref(baseFilters, Math.min(result.pagination.totalPages, result.pagination.page + 1))}
                aria-disabled={result.pagination.page >= result.pagination.totalPages}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 transition",
                  result.pagination.page >= result.pagination.totalPages ? "pointer-events-none opacity-50" : "hover:bg-secondary"
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
