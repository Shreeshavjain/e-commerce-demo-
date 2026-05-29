"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type ProductRowActionsProps = {
  editHref: string;
  productId: string;
  isArchived?: boolean;
};

export function ProductRowActions({ editHref, productId, isArchived = false }: ProductRowActionsProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleArchive() {
    if (typeof window !== "undefined" && !window.confirm("Archive this product?")) {
      return;
    }

    setIsArchiving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; message?: string; error?: string } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? payload?.message ?? "Unable to archive product");
      }

      toast.success(payload.message ?? "Product archived successfully");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to archive product";
      toast.error(message);
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={editHref}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
      >
        <PencilLine className="h-4 w-4" />
        Edit
      </Link>

      {isArchived ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
          Archived
        </span>
      ) : (
        <button
          type="button"
          onClick={handleArchive}
          disabled={isArchiving}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Archive className="h-4 w-4" />
          {isArchiving ? "Archiving" : "Archive"}
        </button>
      )}
    </div>
  );
}