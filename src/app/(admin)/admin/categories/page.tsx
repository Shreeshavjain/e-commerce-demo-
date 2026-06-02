import { listCategories, listCategoryTree } from "@/services/categories";
import Link from "next/link";
import CategoryTable from "@/components/admin/categories/category-table";
import CategoryTree from "@/components/admin/categories/category-tree";

export default async function CategoriesPage() {
  const categories = await listCategories();
  const tree = await listCategoryTree();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Categories</h1>
        <Link href="/admin/categories/new" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          New Category
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryTable categories={categories} />
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-medium">Category Tree</h2>
            <CategoryTree tree={tree} />
          </div>
        </aside>
      </section>
    </div>
  );
}
