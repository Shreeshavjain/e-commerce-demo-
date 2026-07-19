import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  Package,
  PackageOpen,
  Plus,
  Settings,
  ShoppingBag,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isAdminOrAbove } from "@/server/auth/role-guards";
import { getAdminDashboardMetrics, listAdminOrders } from "@/services/orders";
import { listAdminProducts } from "@/services/products";
import { listCategories } from "@/services/categories";
import { OrderStatusBadge } from "@/components/admin/orders/order-status-badge";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeAgo(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser || !isAdminOrAbove(currentUser)) {
    redirect("/login");
  }

  const [metrics, recentOrdersData, productsData, categoriesData] = await Promise.all([
    getAdminDashboardMetrics(),
    listAdminOrders({
      page: 1,
      limit: 5,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    listAdminProducts({ limit: 1 }),
    listCategories(),
  ]);

  const activeCategoriesCount = categoriesData.filter((c) => c.isActive).length;

  return (
    <main className="min-h-screen bg-background pb-16">
      {/* Premium Header Background */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 via-primary/5 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 relative">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80 mb-2">
              Ecommerce Control Center
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md shadow-sm">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDate(new Date())}</span>
          </div>
        </header>

        {/* Overview Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-10">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            description="Lifetime earnings"
          />
          <MetricCard
            title="Total Orders"
            value={recentOrdersData.pagination.total.toString()}
            icon={<ShoppingBag className="h-5 w-5 text-blue-500" />}
            description="All-time orders"
          />
          <MetricCard
            title="Today's Orders"
            value={metrics.todaysOrders.toString()}
            icon={<Clock className="h-5 w-5 text-indigo-500" />}
            description="Last 24 hours"
          />
          <MetricCard
            title="Pending Orders"
            value={metrics.pendingOrders.toString()}
            icon={<Package className="h-5 w-5 text-amber-500" />}
            description="Awaiting processing"
          />
          <MetricCard
            title="Total Products"
            value={productsData.total.toString()}
            icon={<Tags className="h-5 w-5 text-purple-500" />}
            description="Catalog size"
          />
          <MetricCard
            title="Active Categories"
            value={activeCategoriesCount.toString()}
            icon={<LayoutDashboard className="h-5 w-5 text-rose-500" />}
            description="Product groups"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-primary/80"></span>
                Quick Actions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <QuickActionCard
                  href="/admin/products"
                  title="Products"
                  description="Manage inventory"
                  icon={<Package className="h-5 w-5" />}
                  colorClass="text-purple-600 bg-purple-500/10 border-purple-500/20"
                />
                <QuickActionCard
                  href="/admin/categories"
                  title="Categories"
                  description="Manage structure"
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  colorClass="text-rose-600 bg-rose-500/10 border-rose-500/20"
                />
                <QuickActionCard
                  href="/admin/orders"
                  title="Orders"
                  description="Fulfill & track"
                  icon={<ShoppingBag className="h-5 w-5" />}
                  colorClass="text-blue-600 bg-blue-500/10 border-blue-500/20"
                />
                <QuickActionCard
                  href="/admin/products/new"
                  title="Add Product"
                  description="Create new listing"
                  icon={<Plus className="h-5 w-5" />}
                  colorClass="text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                />
                <QuickActionCard
                  href="/admin/categories/new"
                  title="Add Category"
                  description="Create collection"
                  icon={<Plus className="h-5 w-5" />}
                  colorClass="text-amber-600 bg-amber-500/10 border-amber-500/20"
                />
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-6 rounded-full bg-primary/80"></span>
                  Recent Activity
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all orders
                </Link>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
                {recentOrdersData.orders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No recent orders found.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentOrdersData.orders.map((order) => (
                      <li key={order.id} className="group hover:bg-muted/30 transition-colors">
                        <Link href={`/admin/orders/${order.id}`} className="block p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <ShoppingBag className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {order.customerName}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(order.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <p className="text-sm font-semibold text-foreground">
                                {formatCurrency(order.totalAmount)}
                              </p>
                              <div className="flex gap-2">
                                <OrderStatusBadge status={order.orderStatus} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Insights */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-primary/80"></span>
                Quick Insights
              </h2>
              <div className="rounded-[1.5rem] border border-border bg-card/60 backdrop-blur-xl p-5 shadow-sm space-y-5">
                <InsightRow
                  label="Average Order Value"
                  value={recentOrdersData.pagination.total > 0 ? formatCurrency(metrics.totalRevenue / recentOrdersData.pagination.total) : formatCurrency(0)}
                />
                <InsightRow
                  label="Fulfillment Rate"
                  value={recentOrdersData.pagination.total > 0 ? `${Math.round((metrics.deliveredOrders / recentOrdersData.pagination.total) * 100)}%` : "0%"}
                />
                <InsightRow
                  label="Products per Category"
                  value={activeCategoriesCount > 0 ? (productsData.total / activeCategoriesCount).toFixed(1) : "0"}
                />
                <InsightRow
                  label="Unprocessed Orders"
                  value={metrics.pendingOrders.toString()}
                  highlight={metrics.pendingOrders > 0}
                />
              </div>
            </section>

            {/* Coming Soon Modules */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-muted-foreground/30"></span>
                Coming Soon
              </h2>
              <div className="grid gap-3 grid-cols-2">
                <ComingSoonCard title="Analytics" icon={<BarChart3 className="h-4 w-4" />} />
                <ComingSoonCard title="Coupons" icon={<Ticket className="h-4 w-4" />} />
                <ComingSoonCard title="Customers" icon={<Users className="h-4 w-4" />} />
                <ComingSoonCard title="Inventory" icon={<PackageOpen className="h-4 w-4" />} />
                <ComingSoonCard title="Reviews" icon={<FileText className="h-4 w-4" />} />
                <ComingSoonCard title="Settings" icon={<Settings className="h-4 w-4" />} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <div className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border/80">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ href, title, description, icon, colorClass }: { href: string; title: string; description: string; icon: React.ReactNode; colorClass: string }) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
    >
      <div className={cn("mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border", colorClass)}>
        {icon}
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{description}</p>
      <div className="absolute bottom-5 right-5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
        <ArrowRight className="h-5 w-5 text-primary" />
      </div>
    </Link>
  );
}

function InsightRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", highlight ? "text-amber-500" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function ComingSoonCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0 cursor-not-allowed select-none">
      <div className="mb-2 text-muted-foreground">{icon}</div>
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Soon</span>
    </div>
  );
}
