import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, ImageIcon, Package2, Plus, Search } from "lucide-react";
import { listAdminProducts } from "@/services/products";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import type { Product } from "@/types/product";
import { ProductRowActions } from "@/components/admin/products/product-row-actions";
import { cn } from "@/lib/utils";

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPrimaryImage(product: Product) {
  return product.thumbnail?.url ?? product.variants.flatMap((variant) => variant.images).find((image) => image.isPrimary)?.url ?? product.variants[0]?.images[0]?.url ?? null;
}

function getProductPriceRange(product: Product) {
  const prices = product.variants.flatMap((variant) => variant.options.map((option) => option.price)).filter((price) => typeof price === "number");

  if (prices.length === 0) {
    return "No price set";
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return minPrice === maxPrice ? minPrice.toFixed(2) : `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
}

function getTotalStock(product: Product) {
  return product.variants.reduce((variantTotal, variant) => {
    return variantTotal + variant.options.reduce((optionTotal, option) => optionTotal + option.stock, 0);
  }, 0);
}

function getStatusLabel(product: Product) {
  if (product.status === "archived") {
    return "Archived";
  }

  if (product.status === "active" && product.isPublished) {
    return "Active";
  }

  return "Draft";
}

function buildPageHref(searchTerm: string, page: number) {
  const params = new URLSearchParams();

  if (searchTerm) {
    params.set("search", searchTerm);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString ? `/admin/products?${queryString}` : "/admin/products";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser || !isStaffOrAbove(currentUser)) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const searchTerm = getQueryValue(resolvedSearchParams.search) ?? "";
  const currentPage = Math.max(1, Number.parseInt(getQueryValue(resolvedSearchParams.page) ?? "1", 10) || 1);

  const productResult = await listAdminProducts({
    page: currentPage,
    limit: 12,
    search: searchTerm || undefined,
  });

  const showingStart = productResult.total === 0 ? 0 : (productResult.page - 1) * productResult.limit + 1;
  const showingEnd = Math.min(productResult.page * productResult.limit, productResult.total);

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_40%)]" />
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-4 rounded-[2rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Admin dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Manage catalog products</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Review product media, price bands, stock, and publication state from a single server-rendered catalog view.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <form method="get" className="flex w-full gap-2 sm:max-w-md">
              <label className="sr-only" htmlFor="product-search">
                Search products
              </label>
              <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  id="product-search"
                  name="search"
                  defaultValue={searchTerm}
                  placeholder="Search products"
                  className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Search
              </button>
            </form>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium transition hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
              New product
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catalog items</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {showingStart}-{showingEnd} of {productResult.total}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
              <Package2 className="h-4 w-4" />
              {productResult.totalPages} page{productResult.totalPages === 1 ? "" : "s"}
            </div>
          </div>

          {productResult.products.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {productResult.products.map((product) => {
                const primaryImage = getPrimaryImage(product);
                const priceRange = getProductPriceRange(product);
                const totalStock = getTotalStock(product);
                const statusLabel = getStatusLabel(product);

                return (
                  <article key={product.id} className="rounded-[1.5rem] border border-border bg-background/85 p-4 shadow-sm shadow-black/5">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-border bg-muted sm:h-32 sm:w-32">
                        {primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={primaryImage} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-foreground">{product.title}</h2>
                            <p className="text-sm text-muted-foreground">{product.brand || "No brand"}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                                product.status === "archived"
                                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                                  : product.isPublished
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                    : "border-border bg-secondary text-muted-foreground"
                              )}
                            >
                              {statusLabel}
                            </span>
                            {product.isFeatured ? (
                              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="rounded-2xl border border-border bg-card px-3 py-2">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Price</p>
                            <p className="mt-1 font-medium text-foreground">From {priceRange}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-card px-3 py-2">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Stock</p>
                            <p className="mt-1 font-medium text-foreground">{totalStock} units</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full border border-border px-3 py-1">{product.variants.length} color group{product.variants.length === 1 ? "" : "s"}</span>
                            <span className="rounded-full border border-border px-3 py-1">{product.tags.length} tag{product.tags.length === 1 ? "" : "s"}</span>
                          </div>

                          <ProductRowActions
                            editHref={`/admin/products/${product.id}/edit`}
                            productId={product.id}
                            status={product.status}
                            isPublished={product.isPublished}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-background/70 p-10 text-center">
              <p className="text-lg font-semibold text-foreground">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">Create the first catalog entry or clear the current search.</p>
              <div className="mt-6 flex justify-center gap-3">
                {searchTerm ? (
                  <Link href="/admin/products" className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium transition hover:bg-secondary">
                    Clear search
                  </Link>
                ) : null}
                <Link href="/admin/products/new" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Create product
                </Link>
              </div>
            </div>
          )}

          {productResult.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
              <Link
                href={buildPageHref(searchTerm, Math.max(1, productResult.page - 1))}
                aria-disabled={productResult.page <= 1}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 transition",
                  productResult.page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-secondary"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>

              <span>
                Page {productResult.page} of {productResult.totalPages}
              </span>

              <Link
                href={buildPageHref(searchTerm, Math.min(productResult.totalPages, productResult.page + 1))}
                aria-disabled={productResult.page >= productResult.totalPages}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 transition",
                  productResult.page >= productResult.totalPages ? "pointer-events-none opacity-50" : "hover:bg-secondary"
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