"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { ProductCreateInput } from "@/validations/product";
import { createEmptyOption, toMediaAltText } from "@/components/admin/products/product-form-utils";
import { ImageUploadField } from "@/components/admin/products/image-upload-field";
import { OptionVariantRow } from "@/components/admin/products/option-variant-row";

type ColorVariantCardProps = {
  variantIndex: number;
  productSlug: string;
  onRemove: () => void;
};

export function ColorVariantCard({ variantIndex, productSlug, onRemove }: ColorVariantCardProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const { fields: optionFields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.options`,
  });

  const variantName = useWatch({
    control,
    name: `variants.${variantIndex}.name`,
  });

  const variantId = useWatch({
    control,
    name: `variants.${variantIndex}.options.0.variantId`,
  });

  const variantErrors = errors.variants?.[variantIndex];

  return (
    <section className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Color Variant {variantIndex + 1}</p>
          <p className="mt-1 text-sm text-muted-foreground">Configure color identity, gallery assets, and all sellable options inside one card.</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Remove color
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <label className="space-y-1 text-sm lg:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Color name</span>
          <input
            {...register(`variants.${variantIndex}.name`)}
            className={cn(
              "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
              variantErrors?.name && "border-destructive"
            )}
            placeholder="Midnight Black"
          />
          {variantErrors?.name ? <p className="text-xs text-destructive">{variantErrors.name.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Color code</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2">
            <input
              type="color"
              {...register(`variants.${variantIndex}.hexCode`)}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
              aria-label="Color code picker"
            />
            <input
              {...register(`variants.${variantIndex}.hexCode`)}
              className={cn(
                "w-full bg-transparent text-sm outline-none",
                variantErrors?.hexCode && "text-destructive"
              )}
              placeholder="#111111"
            />
          </div>
          {variantErrors?.hexCode ? <p className="text-xs text-destructive">{variantErrors.hexCode.message}</p> : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Variant type</span>
          <select
            {...register(`variants.${variantIndex}.variantType`)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="size">Size</option>
            <option value="storage">Storage</option>
          </select>
          <p className="text-xs text-muted-foreground">Use size for apparel and storage for capacity-based products.</p>
        </label>
      </div>

      <div className="mt-5">
        <Controller
          control={control}
          name={`variants.${variantIndex}.images`}
          render={({ field }) => (
            <ImageUploadField
              multiple
              label="Color image gallery"
              hint="Upload the gallery images that represent this color variant in the storefront."
              value={field.value ?? []}
              onChange={field.onChange}
              folder="color-gallery"
              productSlug={productSlug}
              colorName={variantName || `color-${variantIndex + 1}`}
              variantId={variantId}
              altTextPrefix={toMediaAltText(productSlug, variantName || `Color ${variantIndex + 1}`)}
            />
          )}
        />
        {variantErrors?.images ? <p className="mt-2 text-xs text-destructive">{(variantErrors.images as { message?: string })?.message}</p> : null}
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Final options</p>
            <p className="text-xs text-muted-foreground">Each option gets its own SKU, stock, price, compare-at price, and availability.</p>
          </div>
          <button
            type="button"
            onClick={() => append(createEmptyOption())}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            <Plus className="h-4 w-4" />
            Add option
          </button>
        </div>

        <div className="space-y-3">
          {optionFields.map((field, optionIndex) => (
            <OptionVariantRow
              key={field.id}
              variantIndex={variantIndex}
              optionIndex={optionIndex}
              onRemove={() => remove(optionIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
