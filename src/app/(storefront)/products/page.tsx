import type { Metadata } from "next";
import { ProductCard } from "@/components/storefront/product-card";
import { listProducts } from "@/services/products";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse published products from the storefront catalog.",
};

export default async function ProductsPage() {
  const result = await listProducts();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Storefront</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Products</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Explore published items from the catalog with live pricing and variant availability.
        </p>
      </div>

      {result.products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">No products available yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Published products will appear here once they are added to the catalog.</p>
        </div>
      )}
    </main>
  );
}
