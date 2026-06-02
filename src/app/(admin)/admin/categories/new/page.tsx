import Link from "next/link";
import CategoryForm from "@/components/admin/categories/category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Create Category</h1>
        <Link href="/admin/categories" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          Back to list
        </Link>
      </div>

      <section className="rounded-lg border p-6">
        <CategoryForm />
      </section>
    </div>
  );
}
