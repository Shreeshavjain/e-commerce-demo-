import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/products/product-form";
import { listActiveCategoryTree } from "@/services/categories";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";

export const metadata: Metadata = {
  title: "Create product",
  description: "Production-scalable product creation dashboard for the ecommerce admin.",
};

export default async function NewProductPage() {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser || !isStaffOrAbove(currentUser)) {
    redirect("/login");
  }

  const categories = await listActiveCategoryTree();

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_40%)]" />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 rounded-[2rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Admin dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create catalog products with nested variants</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              This workspace is wired to the existing authentication, Cloudinary upload route, product API, and variant identity system so catalog creation stays consistent with the rest of the platform.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Auth</p>
              <p className="mt-2 text-sm font-medium text-foreground">Staff gated</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Media</p>
              <p className="mt-2 text-sm font-medium text-foreground">Cloudinary upload API</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Variants</p>
              <p className="mt-2 text-sm font-medium text-foreground">Color + size/storage</p>
            </div>
          </div>
        </div>

        <ProductForm categories={categories} />
      </div>
    </main>
  );
}
