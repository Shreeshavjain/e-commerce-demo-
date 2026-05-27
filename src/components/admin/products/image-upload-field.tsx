"use client";

import { useId, useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProductMediaDraft } from "@/components/admin/products/product-form-utils";

type UploadResponse = {
  uploads: Array<{
    secureUrl: string;
    publicId: string;
    createdAt: string;
  }>;
};

type BaseProps = {
  label: string;
  hint?: string;
  folder?: string;
  productSlug?: string;
  colorName?: string;
  variantId?: string;
  altTextPrefix?: string;
  className?: string;
};

type SingleValueProps = BaseProps & {
  multiple?: false;
  value: ProductMediaDraft | null;
  onChange: (value: ProductMediaDraft | null) => void;
};

type MultiValueProps = BaseProps & {
  multiple: true;
  value: ProductMediaDraft[];
  onChange: (value: ProductMediaDraft[]) => void;
};

export type ImageUploadFieldProps = SingleValueProps | MultiValueProps;

function normalizeMediaValue(upload: UploadResponse["uploads"][number], altText: string, isPrimary = false): ProductMediaDraft {
  return {
    url: upload.secureUrl,
    publicId: upload.publicId,
    altText,
    isPrimary,
  };
}

async function uploadFiles(files: File[], props: BaseProps) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  if (props.folder) formData.append("folder", props.folder);
  if (props.productSlug) formData.append("productSlug", props.productSlug);
  if (props.colorName) formData.append("colorName", props.colorName);
  if (props.variantId) formData.append("variantId", props.variantId);

  const response = await fetch("/api/uploads/product-images", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as { success?: boolean; message?: string; error?: string; data?: UploadResponse };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? payload.message ?? "Image upload failed");
  }

  return payload.data.uploads;
}

export function ImageUploadField(props: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaItems = Array.isArray(props.value) ? props.value : props.value ? [props.value] : [];
  const isMultiple = props.multiple === true;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploads = await uploadFiles(files, props);
      const productTitle = props.altTextPrefix ?? props.label;
      const uploadedMedia = uploads.map((upload, index) =>
        normalizeMediaValue(
          upload,
          props.altTextPrefix ? `${props.altTextPrefix} ${index + 1}` : productTitle,
          !isMultiple || (mediaItems.length === 0 && index === 0)
        )
      );

      if (isMultiple) {
        props.onChange([...(props.value as ProductMediaDraft[]), ...uploadedMedia]);
      } else {
        props.onChange(uploadedMedia[0] ?? null);
      }

      toast.success("Image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemoveImage(index: number) {
    if (isMultiple) {
      const nextValue = (props.value as ProductMediaDraft[]).filter((_, itemIndex) => itemIndex !== index);
      props.onChange(nextValue);
      return;
    }

    props.onChange(null);
  }

  return (
    <div className={cn("rounded-2xl border border-dashed border-border bg-background/70 p-4", props.className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {props.label}
          </label>
          {props.hint ? <p className="text-xs leading-5 text-muted-foreground">{props.hint}</p> : null}
        </div>
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {isUploading ? "Uploading" : isMultiple ? "Upload images" : "Upload image"}
        </label>
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple={isMultiple}
        onChange={handleFileChange}
        className="sr-only"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {mediaItems.length > 0 ? (
          mediaItems.map((image, index) => (
            <div key={`${image.publicId}-${index}`} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-[4/3] bg-muted">
                <img src={image.url} alt={image.altText || props.label} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{image.altText || props.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{image.publicId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-border bg-muted/35 p-6 text-sm text-muted-foreground">
            No images uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
