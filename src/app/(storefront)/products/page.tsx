import type { Metadata } from "next";
import { ProductCard } from "@/components/storefront/product-card";
import { listProducts } from "@/services/products";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse published products from the storefront catalog.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;

  const result = await listProducts({ category, search });

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 pt-32">
      <div className="mb-12 space-y-2 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Products</h1>
        <p className="max-w-2xl text-lg font-medium text-slate-500 mx-auto sm:mx-0">
          Explore our latest collection of premium products.
        </p>
      </div>

      {result.products.length > 0 ? (
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-gray-100 bg-white px-6 py-20 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <p className="text-2xl font-black text-slate-900 tracking-tight">No products available yet</p>
          <p className="mt-2 text-base font-medium text-slate-500">Published products will appear here once they are added to the catalog.</p>
        </div>
      )}
    </main>
  );
}
