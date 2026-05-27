"use client";

import { Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { ProductCreateInput } from "@/validations/product";

type OptionVariantRowProps = {
  variantIndex: number;
  optionIndex: number;
  onRemove: () => void;
};

export function OptionVariantRow({ variantIndex, optionIndex, onRemove }: OptionVariantRowProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const optionErrors = errors.variants?.[variantIndex]?.options?.[optionIndex];

  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Option {optionIndex + 1}</p>
          <p className="text-xs text-muted-foreground">Final sellable option with identity, pricing, stock, and availability.</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Variant ID</span>
          <input
            {...register(`variants.${variantIndex}.options.${optionIndex}.variantId`)}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              optionErrors?.variantId && "border-destructive"
            )}
            placeholder="variant_a1b2c3d4"
          />
          {optionErrors?.variantId ? <p className="text-xs text-destructive">{optionErrors.variantId.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Label</span>
          <input
            {...register(`variants.${variantIndex}.options.${optionIndex}.label`)}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              optionErrors?.label && "border-destructive"
            )}
            placeholder="Large"
          />
          {optionErrors?.label ? <p className="text-xs text-destructive">{optionErrors.label.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SKU</span>
          <input
            {...register(`variants.${variantIndex}.options.${optionIndex}.sku`)}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              optionErrors?.sku && "border-destructive"
            )}
            placeholder="PHONE-BLACK-L-001"
          />
          {optionErrors?.sku ? <p className="text-xs text-destructive">{optionErrors.sku.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</span>
          <input
            type="number"
            step="0.01"
            {...register(`variants.${variantIndex}.options.${optionIndex}.price`, { valueAsNumber: true })}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              optionErrors?.price && "border-destructive"
            )}
            placeholder="0"
          />
          {optionErrors?.price ? <p className="text-xs text-destructive">{optionErrors.price.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compare-at price</span>
          <input
            type="number"
            step="0.01"
            {...register(`variants.${variantIndex}.options.${optionIndex}.compareAtPrice`, {
              setValueAs: (value) => (value === "" || value === null ? null : Number(value)),
            })}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              optionErrors?.compareAtPrice && "border-destructive"
            )}
            placeholder="0"
          />
          {optionErrors?.compareAtPrice ? <p className="text-xs text-destructive">{optionErrors.compareAtPrice.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stock</span>
          <input
            type="number"
            min="0"
            step="1"
            {...register(`variants.${variantIndex}.options.${optionIndex}.stock`, { valueAsNumber: true })}
            className={cn(
              "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              optionErrors?.stock && "border-destructive"
            )}
            placeholder="0"
          />
          {optionErrors?.stock ? <p className="text-xs text-destructive">{optionErrors.stock.message}</p> : null}
        </label>
      </div>

      <label className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          {...register(`variants.${variantIndex}.options.${optionIndex}.isAvailable`)}
          className="h-4 w-4 rounded border-border"
        />
        Available for sale
      </label>
    </div>
  );
}
