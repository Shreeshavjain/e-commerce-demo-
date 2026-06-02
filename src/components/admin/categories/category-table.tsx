"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React from "react";
import type { CategoryListItem } from "@/services/categories";

type Props = {
  categories: CategoryListItem[];
};

export default function CategoryTable({ categories }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (typeof window !== "undefined" && !confirm("Delete this category?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error ?? payload?.message ?? "Unable to delete category");
      }

      toast.success(payload.message ?? "Category removed");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete category";
      toast.error(message);
    }
  }

  async function toggleActive(id: string, currentlyActive: boolean) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error ?? payload?.message ?? "Unable to update category");
      }

      toast.success(payload.message ?? (currentlyActive ? "Category deactivated" : "Category activated"));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update category";
      toast.error(message);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto divide-y">
        <thead className="bg-muted-foreground/5 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Slug</th>
            <th className="px-3 py-2">Parent</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Sort</th>
            <th className="px-3 py-2">Active</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {categories.map((c) => (
            <tr key={c.id} className="hover:bg-muted-foreground/3">
              <td className="px-3 py-3 align-top">
                <div className="font-medium">{c.name}</div>
              </td>
              <td className="px-3 py-3 align-top text-sm text-muted-foreground">{c.slug}</td>
              <td className="px-3 py-3 align-top text-sm">{c.parentCategoryName ?? "—"}</td>
              <td className="px-3 py-3 align-top text-sm">{c.status}</td>
              <td className="px-3 py-3 align-top text-sm">{c.sortOrder}</td>
              <td className="px-3 py-3 align-top text-sm">{c.isActive ? "Yes" : "No"}</td>
              <td className="px-3 py-3 align-top text-sm">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/categories/${c.id}/edit`} className="rounded-full border px-3 py-1 text-sm hover:bg-secondary">
                    Edit
                  </Link>

                  <button onClick={() => toggleActive(c.id, c.isActive)} className="rounded-full border px-3 py-1 text-sm hover:bg-secondary">
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button onClick={() => handleDelete(c.id)} className="rounded-full border px-3 py-1 text-sm text-destructive hover:bg-destructive/5">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
