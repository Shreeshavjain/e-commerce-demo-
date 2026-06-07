"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CategoryDetail, CategoryTreeNode } from "@/services/categories";

type ParentOption = {
  id: string;
  name: string;
};

type Props = {
  initialData?: CategoryDetail | null;
  parentCategories: CategoryTreeNode[];
};

function findCategoryNode(nodes: CategoryTreeNode[], categoryId: string): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === categoryId) {
      return node;
    }

    const childMatch = findCategoryNode(node.children, categoryId);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>([node.id]);

  for (const child of node.children) {
    for (const childId of collectDescendantIds(child)) {
      ids.add(childId);
    }
  }

  return ids;
}

function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  excludedIds: Set<string> = new Set(),
  prefix = ""
): ParentOption[] {
  const options: ParentOption[] = [];

  for (const node of nodes) {
    if (excludedIds.has(node.id)) {
      continue;
    }

    options.push({ id: node.id, name: `${prefix}${node.name}` });

    if (node.children.length > 0) {
      options.push(...flattenCategoryTree(node.children, excludedIds, `${prefix}${node.name} > `));
    }
  }

  return options;
}

export default function CategoryForm({ initialData = null, parentCategories }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(initialData?.parentCategoryId ?? undefined);
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentOptions = useMemo(() => {
    const excludedIds = new Set<string>();

    if (initialData?.id) {
      const currentNode = findCategoryNode(parentCategories, initialData.id);
      if (currentNode) {
        for (const id of collectDescendantIds(currentNode)) {
          excludedIds.add(id);
        }
      } else {
        excludedIds.add(initialData.id);
      }
    }

    const options = flattenCategoryTree(parentCategories, excludedIds);

    if (process.env.NODE_ENV === "development") {
      console.log("[categories][form] parent options built", {
        treeCount: parentCategories.length,
        optionCount: options.length,
        excludedIds: [...excludedIds],
      });
    }

    return options;
  }, [initialData?.id, parentCategories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const isEditMode = Boolean(initialData?.id);
    const requestUrl = isEditMode ? `/api/admin/categories/${initialData?.id}` : "/api/admin/categories";
    const requestMethod = isEditMode ? "PATCH" : "POST";
    const payload = {
      name,
      slug: slug.trim() || undefined,
      description,
      parentCategory: parentCategoryId ?? undefined,
      sortOrder,
      isActive,
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[categories][form] submit", {
        requestUrl,
        requestMethod,
        payload,
      });
    }

    try {
      const res = await fetch(requestUrl, {
        method: requestMethod,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);

      if (process.env.NODE_ENV === "development") {
        console.log("[categories][form] response", {
          requestUrl,
          status: res.status,
          success: body?.success,
          message: body?.message,
          error: body?.error,
        });
      }

      if (!res.ok || !body?.success) {
        throw new Error(body?.error ?? body?.message ?? "Unable to save category");
      }

      toast.success(body.message ?? (isEditMode ? "Category updated successfully" : "Category created successfully"));
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-xs font-medium uppercase text-muted-foreground">Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm" required />
        </label>

        <label className="space-y-1">
          <div className="text-xs font-medium uppercase text-muted-foreground">Slug</div>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Auto-generated from name when left empty"
            className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
          />
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
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
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

        <button type="button" onClick={() => { router.push("/admin/categories"); }} className="rounded-full border px-4 py-2 text-sm hover:bg-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
