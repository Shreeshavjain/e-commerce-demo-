"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, PencilLine, RotateCcw, Trash2, Upload, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { ProductStatus } from "@/models/constants";
import type { ProductPublicationAction } from "@/validations/product";

type ProductRowActionsProps = {
  editHref: string;
  productId: string;
  status: ProductStatus;
  isPublished: boolean;
};

type PublicationState = "draft" | "active" | "archived";

function getPublicationState(status: ProductStatus, isPublished: boolean): PublicationState {
  if (status === "archived") {
    return "archived";
  }

  if (status === "active" && isPublished) {
    return "active";
  }

  return "draft";
}

const actionSuccessMessages: Record<ProductPublicationAction["action"], string> = {
  publish: "Product published",
  unpublish: "Product unpublished",
  archive: "Product archived",
  restore: "Product restored",
};

export function ProductRowActions({ editHref, productId, status, isPublished }: ProductRowActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const publicationState = getPublicationState(status, isPublished);

  async function runPublicationAction(action: ProductPublicationAction["action"], confirmMessage?: string) {
    if (confirmMessage && typeof window !== "undefined" && !window.confirm(confirmMessage)) {
      return;
    }

    setPendingAction(action);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; message?: string; error?: string } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? payload?.message ?? "Unable to update product");
      }

      toast.success(payload.message ?? actionSuccessMessages[action]);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update product";
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (typeof window !== "undefined" && !window.confirm("Archive this product? It will be removed from the storefront.")) {
      return;
    }

    setPendingAction("delete");

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; message?: string; error?: string } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? payload?.message ?? "Unable to archive product");
      }

      toast.success(payload.message ?? "Product archived");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to archive product";
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  const actionButtonClassName =
    "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60";
  const destructiveButtonClassName =
    "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {publicationState === "draft" ? (
        <button
          type="button"
          onClick={() => runPublicationAction("publish")}
          disabled={pendingAction !== null}
          className={actionButtonClassName}
        >
          <UploadCloud className="h-4 w-4" />
          {pendingAction === "publish" ? "Publishing..." : "Publish"}
        </button>
      ) : null}

      {publicationState === "active" ? (
        <button
          type="button"
          onClick={() => runPublicationAction("unpublish")}
          disabled={pendingAction !== null}
          className={actionButtonClassName}
        >
          <Upload className="h-4 w-4" />
          {pendingAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
        </button>
      ) : null}

      {publicationState === "archived" ? (
        <button
          type="button"
          onClick={() => runPublicationAction("restore")}
          disabled={pendingAction !== null}
          className={actionButtonClassName}
        >
          <RotateCcw className="h-4 w-4" />
          {pendingAction === "restore" ? "Restoring..." : "Restore"}
        </button>
      ) : null}

      <Link href={editHref} className={actionButtonClassName}>
        <PencilLine className="h-4 w-4" />
        Edit
      </Link>

      {publicationState === "active" ? (
        <button
          type="button"
          onClick={() => runPublicationAction("archive", "Archive this product?")}
          disabled={pendingAction !== null}
          className={destructiveButtonClassName}
        >
          <Archive className="h-4 w-4" />
          {pendingAction === "archive" ? "Archiving..." : "Archive"}
        </button>
      ) : null}

      {publicationState === "draft" || publicationState === "archived" ? (
        <button type="button" onClick={handleDelete} disabled={pendingAction !== null} className={destructiveButtonClassName}>
          <Trash2 className="h-4 w-4" />
          {pendingAction === "delete" ? "Archiving..." : "Delete"}
        </button>
      ) : null}
    </div>
  );
}
