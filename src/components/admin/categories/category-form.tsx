"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CategoryDetail } from "@/services/categories";

type Props = {
  initialData?: CategoryDetail | null;
};

export default function CategoryForm({ initialData = null }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(initialData?.parentCategoryId ?? undefined);
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [parentOptions, setParentOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // load parent category options (flat list)
    async function load() {
      try {
        const res = await fetch(`/api/admin/categories`);
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.success) return;
        const items = payload.data; // tree

        // flatten to simple options (id, name) using DFS
        const options: Array<{ id: string; name: string }> = [];

        function walk(nodes: any[], prefix = "") {
          for (const node of nodes) {
            options.push({ id: node.id, name: `${prefix}${node.name}` });
            if (node.children && node.children.length) {
              walk(node.children, `${prefix}${node.name} > `);
            }
          }
        }

        walk(items);
        setParentOptions(options);
      } catch (err) {
        // ignore
      }
    }

    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { name, slug, description, parentCategory: parentCategoryId ?? undefined, sortOrder, isActive };
      const res = await fetch(`/api/admin/categories`, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        throw new Error(body?.error ?? body?.message ?? "Unable to save category");
      }

      toast.success(body.message ?? (initialData ? "Category updated" : "Category created"));
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save category";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-xs font-medium uppercase text-muted-foreground">Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" required />
        </label>

        <label className="space-y-1">
          <div className="text-xs font-medium uppercase text-muted-foreground">Slug</div>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" />
        </label>
      </div>

      <label className="space-y-1">
        <div className="text-xs font-medium uppercase text-muted-foreground">Description</div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1">
          <div className="text-xs font-medium uppercase text-muted-foreground">Parent Category</div>
          <select value={parentCategoryId ?? ""} onChange={(e) => setParentCategoryId(e.target.value || undefined)} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm">
            <option value="">None</option>
            {parentOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-xs font-medium uppercase text-muted-foreground">Sort Order</div>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" />
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="text-sm">Active</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60">
          {isSubmitting ? "Saving..." : initialData ? "Update Category" : "Create Category"}
        </button>

        <button type="button" onClick={() => { router.push('/admin/categories'); }} className="rounded-full border px-4 py-2 text-sm hover:bg-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
