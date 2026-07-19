import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isAdminOrAbove } from "@/server/auth/role-guards";
import { getAdminOrderById } from "@/services/orders";
import { AdminOrderDetailClient } from "@/components/admin/orders/admin-order-detail-client";

type AdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser || !isAdminOrAbove(currentUser)) {
    redirect("/login");
  }

  const { orderId } = await params;
  const order = await getAdminOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_45%)]" />
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </div>

        <AdminOrderDetailClient initialOrder={order} />
      </div>
    </main>
  );
}
