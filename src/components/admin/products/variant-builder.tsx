"use client";

import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { ProductCreateInput } from "@/validations/product";
import { createEmptyColorVariant } from "@/components/admin/products/product-form-utils";
import { ColorVariantCard } from "@/components/admin/products/color-variant-card";

type VariantBuilderProps = {
  productSlug: string;
};

export function VariantBuilder({ productSlug }: VariantBuilderProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const variantError = errors.variants;

  return (
    <section className="space-y-4 rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nested builder</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Color variants and sellable options</h2>
          <p className="mt-1 text-sm text-muted-foreground">Build the full product tree: product -&gt; color variant -&gt; final option identity.</p>
        </div>
        <button
          type="button"
          onClick={() => append(createEmptyColorVariant())}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add color variant
        </button>
      </div>

      {variantError ? <p className={cn("text-sm text-destructive")}>{typeof variantError?.message === "string" ? variantError.message : "Add at least one color variant."}</p> : null}

      <div className="space-y-4">
        {fields.map((field, variantIndex) => (
          <ColorVariantCard
            key={field.id}
            variantIndex={variantIndex}
            productSlug={productSlug}
            onRemove={() => remove(variantIndex)}
          />
        ))}
      </div>
    </section>
  );
}
