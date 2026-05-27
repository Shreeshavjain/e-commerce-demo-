"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { Check, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CategoryTreeNode } from "@/services/categories";
import { productCreateSchema, type ProductMediaInput } from "@/validations/product";
import { ImageUploadField } from "@/components/admin/products/image-upload-field";
import { VariantBuilder } from "@/components/admin/products/variant-builder";
import {
  arrayToTagsValue,
  createEmptyProductDraft,
  slugifyDraftValue,
  tagsToArray,
  toMediaAltText,
} from "@/components/admin/products/product-form-utils";

type ProductFormProps = {
  categories: CategoryTreeNode[];
};

type ProductFormValues = z.input<typeof productCreateSchema>;

function findCategoryById(categories: CategoryTreeNode[], categoryId: string): CategoryTreeNode | null {
  for (const category of categories) {
    if (category.id === categoryId) {
      return category;
    }

    const childMatch = findCategoryById(category.children, categoryId);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

function getRootCategories(categories: CategoryTreeNode[]) {
  return categories;
}

export function ProductForm({ categories }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: createEmptyProductDraft(),
    mode: "onBlur",
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const title = (useWatch({ control, name: "title" }) ?? "") as string;
  const slugValue = (useWatch({ control, name: "slug" }) ?? "") as string;
  const categoryValue = (useWatch({ control, name: "category" }) ?? "") as string;
  const subCategoryValue = (useWatch({ control, name: "subCategory" }) ?? "") as string;
  const tagsValue = (useWatch({ control, name: "tags" }) ?? []) as string[];
  const thumbnailValue = useWatch({ control, name: "thumbnail" }) as ProductMediaInput | null | undefined;
  const variantCount = ((useWatch({ control, name: "variants" }) ?? []) as ProductFormValues["variants"]).length;

  const productSlug = useMemo(() => slugifyDraftValue(slugValue || title || "draft-product"), [slugValue, title]);
  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);
  const selectedCategory = useMemo(() => findCategoryById(categories, categoryValue), [categories, categoryValue]);
  const subcategories = selectedCategory?.children ?? [];

  async function onSubmit(values: ProductFormValues) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as { success?: boolean; message?: string; error?: string };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? payload.message ?? "Unable to create product");
    }

    toast.success(payload.message ?? "Product created successfully");
    reset(createEmptyProductDraft());
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="grid gap-6 rounded-[1.9rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Product creation workspace
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create a production-ready catalog product</h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Build the product record once, then attach the thumbnail, color galleries, and final sellable options in the same flow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</span>
                <input
                  {...register("title")}
                  className={cn(
                    "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
                    errors.title && "border-destructive"
                  )}
                  placeholder="Premium wireless headphones"
                />
                {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Short description</span>
                <input
                  {...register("shortDescription")}
                  className={cn(
                    "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
                    errors.shortDescription && "border-destructive"
                  )}
                  placeholder="A concise, high-impact product summary"
                />
                {errors.shortDescription ? <p className="text-xs text-destructive">{errors.shortDescription.message}</p> : null}
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full description</span>
                <textarea
                  {...register("description")}
                  rows={6}
                  className={cn(
                    "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
                    errors.description && "border-destructive"
                  )}
                  placeholder="Tell the full story of the product, its materials, specs, and differentiators."
                />
                {errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand</span>
                <input
                  {...register("brand")}
                  className={cn(
                    "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
                    errors.brand && "border-destructive"
                  )}
                  placeholder="Apex Audio"
                />
                {errors.brand ? <p className="text-xs text-destructive">{errors.brand.message}</p> : null}
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Optional slug</span>
                <input
                  {...register("slug")}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder={productSlug}
                />
                <p className="text-xs text-muted-foreground">If left empty, the backend will generate one from the title.</p>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</span>
                <select
                  {...register("category")}
                  className={cn(
                    "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20",
                    errors.category && "border-destructive"
                  )}
                >
                  <option value="">Select a category</option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category ? <p className="text-xs text-destructive">{errors.category.message}</p> : null}
              </label>

              <div className="space-y-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subcategory</span>
                <Controller
                  control={control}
                  name="subCategory"
                  render={({ field }) => (
                    <select
                      value={(field.value ?? "") as string}
                      onChange={(event) => field.onChange(event.target.value || undefined)}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!selectedCategory || subcategories.length === 0}
                    >
                      <option value="">{selectedCategory ? "Select a subcategory" : "Choose a category first"}</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <p className="text-xs text-muted-foreground">Subcategories are resolved from the selected category tree.</p>
              </div>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</span>
                <input
                  value={arrayToTagsValue(tagsValue ?? [])}
                  onChange={(event) => setValue("tags", tagsToArray(event.target.value), { shouldDirty: true, shouldValidate: true })}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="headphones, wireless, premium, audio"
                />
                <p className="text-xs text-muted-foreground">Separate tags with commas. They will be normalized before submission.</p>
              </label>
            </div>
          </div>

          <aside className="space-y-4 rounded-[1.5rem] border border-border bg-background/80 p-5 lg:sticky lg:top-6 lg:self-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current build</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <span>Product slug</span>
                  <span className="font-medium text-foreground">{productSlug}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <span>Thumbnail</span>
                  <span className="font-medium text-foreground">{thumbnailValue ? "Ready" : "Missing"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <span>Variant groups</span>
                  <span className="font-medium text-foreground">{variantCount}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Workflow notes</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Upload the thumbnail through Cloudinary before creating the product.</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Each color card can upload its own gallery and nested sellable options.</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Variant IDs and SKUs are validated again on the server.
                </li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
          <Controller
            control={control}
            name="thumbnail"
            render={({ field }) => (
              <ImageUploadField
                label="Thumbnail upload"
                hint="This single image becomes the product card and primary admin preview image."
                value={field.value ?? null}
                onChange={field.onChange}
                multiple={false}
                folder="thumbnail"
                productSlug={productSlug}
                altTextPrefix={toMediaAltText(productSlug, title || "Thumbnail")}
              />
            )}
          />
          {errors.thumbnail ? <p className="mt-2 text-xs text-destructive">{errors.thumbnail.message as string}</p> : null}
        </section>

        <VariantBuilder productSlug={productSlug} />

        <section className="grid gap-4 rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 md:grid-cols-2 sm:p-6">
          <label className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-sm font-medium text-foreground">
            <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 rounded border-border" />
            Featured product
          </label>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-sm font-medium text-foreground">
            <input type="checkbox" {...register("isPublished")} className="h-4 w-4 rounded border-border" />
            Publish immediately
          </label>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => reset(createEmptyProductDraft())}
            className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium transition hover:bg-secondary"
          >
            Reset draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create product
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
