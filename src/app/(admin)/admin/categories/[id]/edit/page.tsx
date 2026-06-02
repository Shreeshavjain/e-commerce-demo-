import { getCategoryById } from "@/services/categories";
import dynamic from "next/dynamic";
import Link from "next/link";

const CategoryForm = dynamic(() => import("@/components/admin/categories/category-form"), { ssr: false });

type Props = {
  params: { id: string };
};

export default async function EditCategoryPage({ params }: Props) {
  const category = await getCategoryById(params.id);

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
        {/* CategoryForm will detect edit mode when initialData prop is present */}
        <CategoryForm initialData={category} />
      </section>
    </div>
  );
}
