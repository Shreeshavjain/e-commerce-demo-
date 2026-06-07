import Link from "next/link";
import CategoryForm from "@/components/admin/categories/category-form";
import { getCategoryById, listCategoryTree } from "@/services/categories";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const resolvedParams = await params;
  const categoryId = resolvedParams.id?.trim();

  if (!categoryId) {
    return <div>Category not found</div>;
  }

  const [category, parentCategories] = await Promise.all([getCategoryById(categoryId), listCategoryTree()]);

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Edit Category</h1>
        <Link href="/admin/categories" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          Back to list
        </Link>
      </div>

      <section className="rounded-lg border p-6">
        <CategoryForm initialData={category} parentCategories={parentCategories} />
      </section>
    </div>
  );
}
