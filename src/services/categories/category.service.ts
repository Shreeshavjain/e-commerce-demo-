import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { CategoryModel } from "@/models/category";
import { ProductModel } from "@/models/product";
import type { CategoryStatus } from "@/models/constants";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/validations/category";

type CategoryRecord = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategory: Types.ObjectId | null;
  isActive: boolean;
  status: CategoryStatus;
  sortOrder: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategory: string | null;
  isActive: boolean;
  status: CategoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children: CategoryTreeNode[];
};

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  parentCategorySlug: string | null;
  isActive: boolean;
  status: CategoryStatus;
  sortOrder: number;
  depth: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDetail = CategoryListItem;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value?: string | null) {
  return value?.trim() ?? "";
}

function toObjectId(value: string | Types.ObjectId | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}

function isActiveCategory(category: Pick<CategoryRecord, "isActive" | "status">) {
  return category.isActive && category.status === "active";
}

async function generateUniqueSlug(baseSlug: string, excludedCategoryId?: string) {
  const normalizedBaseSlug = slugify(baseSlug) || `category-${Date.now()}`;
  let candidateSlug = normalizedBaseSlug;
  let suffix = 2;

  while (
    await CategoryModel.exists(
      excludedCategoryId ? { slug: candidateSlug, _id: { $ne: new Types.ObjectId(excludedCategoryId) } } : { slug: candidateSlug }
    )
  ) {
    candidateSlug = `${normalizedBaseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidateSlug;
}

async function loadCategoryRecords() {
  return CategoryModel.find({}).sort({ sortOrder: 1, name: 1, _id: 1 }).lean<CategoryRecord[]>();
}

function buildTree(records: CategoryRecord[], options: { onlyActiveBranches?: boolean } = {}) {
  const childrenByParent = new Map<string | null, CategoryRecord[]>();

  for (const record of records) {
    const parentKey = record.parentCategory ? record.parentCategory.toString() : null;
    const existingChildren = childrenByParent.get(parentKey) ?? [];
    existingChildren.push(record);
    childrenByParent.set(parentKey, existingChildren);
  }

  const sortRecords = (items: CategoryRecord[]) => [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));

  const buildNodes = (parentId: string | null, ancestorIsActive: boolean): CategoryTreeNode[] => {
    const children = sortRecords(childrenByParent.get(parentId) ?? []);

    return children.flatMap((record) => {
      const branchIsActive = ancestorIsActive && (!options.onlyActiveBranches || isActiveCategory(record));

      if (options.onlyActiveBranches && !branchIsActive) {
        return [];
      }

      const createdAtIso = record.createdAt ? record.createdAt.toISOString() : "";
      const updatedAtIso = record.updatedAt ? record.updatedAt.toISOString() : "";

      return [
        {
          id: record._id.toString(),
          name: record.name,
          slug: record.slug,
          description: record.description ?? "",
          image: record.image ?? "",
          parentCategory: record.parentCategory ? record.parentCategory.toString() : null,
          isActive: record.isActive,
          status: record.status,
          sortOrder: record.sortOrder ?? 0,
          createdAt: createdAtIso,
          updatedAt: updatedAtIso,
          children: buildNodes(record._id.toString(), branchIsActive),
        },
      ];
    });
  };

  return buildNodes(null, true);
}

function flattenTree(nodes: CategoryTreeNode[], recordsById: Map<string, CategoryRecord>, depth = 0): CategoryListItem[] {
  return nodes.flatMap((node) => {
    const record = recordsById.get(node.id);
    const item: CategoryListItem = {
      id: node.id,
      name: node.name,
      slug: node.slug,
      description: node.description,
      image: node.image,
      parentCategoryId: node.parentCategory,
      parentCategoryName: node.parentCategory ? recordsById.get(node.parentCategory)?.name ?? null : null,
      parentCategorySlug: node.parentCategory ? recordsById.get(node.parentCategory)?.slug ?? null : null,
      isActive: node.isActive,
      status: node.status,
      sortOrder: node.sortOrder,
      depth,
      childrenCount: node.children.length,
      createdAt: record?.createdAt ? record.createdAt.toISOString() : node.createdAt ?? "",
      updatedAt: record?.updatedAt ? record.updatedAt.toISOString() : node.updatedAt ?? "",
    };

    return [item, ...flattenTree(node.children, recordsById, depth + 1)];
  });
}

async function validateParentCategory(parentCategoryId: string, excludedCategoryId?: string) {
  const parent = await CategoryModel.findById(parentCategoryId)
    .select("parentCategory isActive status")
    .lean<{ parentCategory: Types.ObjectId | null; isActive: boolean; status: CategoryStatus } | null>();

  if (!parent) {
    throw new Error("Parent category not found");
  }

  if (!isActiveCategory(parent)) {
    throw new Error("Parent category must be active");
  }

  if (!excludedCategoryId) {
    return;
  }

  let cursorParentId = parent.parentCategory ? parent.parentCategory.toString() : null;

  while (cursorParentId) {
    if (cursorParentId === excludedCategoryId) {
      throw new Error("A category cannot be assigned to itself or one of its descendants");
    }

    const cursor = await CategoryModel.findById(cursorParentId)
      .select("parentCategory")
      .lean<{ parentCategory: Types.ObjectId | null } | null>();

    cursorParentId = cursor?.parentCategory ? cursor.parentCategory.toString() : null;
  }
}

async function getDescendantIds(categoryId: string, records: CategoryRecord[]) {
  const descendants = new Set<string>();
  const childrenByParent = new Map<string, string[]>();

  for (const record of records) {
    const parentId = record.parentCategory ? record.parentCategory.toString() : null;

    if (!parentId) {
      continue;
    }

    const children = childrenByParent.get(parentId) ?? [];
    children.push(record._id.toString());
    childrenByParent.set(parentId, children);
  }

  const stack = [...(childrenByParent.get(categoryId) ?? [])];

  while (stack.length > 0) {
    const currentId = stack.pop();

    if (!currentId || descendants.has(currentId)) {
      continue;
    }

    descendants.add(currentId);
    stack.push(...(childrenByParent.get(currentId) ?? []));
  }

  return [...descendants];
}

export async function listActiveCategoryTree() {
  await connectToDatabase();

  const records = await loadCategoryRecords();
  return buildTree(records, { onlyActiveBranches: true });
}

export async function listCategoryTree() {
  await connectToDatabase();

  const records = await loadCategoryRecords();
  return buildTree(records);
}

export async function listCategories() {
  await connectToDatabase();

  const records = await loadCategoryRecords();
  const recordsById = new Map(records.map((record) => [record._id.toString(), record]));
  return flattenTree(buildTree(records), recordsById);
}

export async function getCategoryById(id: string) {
  await connectToDatabase();

  const records = await loadCategoryRecords();
  const recordsById = new Map(records.map((record) => [record._id.toString(), record]));
  const category = recordsById.get(id);

  if (!category) {
    return null;
  }

  const childrenCount = records.filter((record) => record.parentCategory?.toString() === category._id.toString()).length;
  const parent = category.parentCategory ? recordsById.get(category.parentCategory.toString()) ?? null : null;

    const createdAtIso = category.createdAt ? category.createdAt.toISOString() : "";
    const updatedAtIso = category.updatedAt ? category.updatedAt.toISOString() : "";

    return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: category.image ?? "",
    parentCategoryId: category.parentCategory ? category.parentCategory.toString() : null,
    parentCategoryName: parent?.name ?? null,
    parentCategorySlug: parent?.slug ?? null,
    isActive: category.isActive,
    status: category.status,
    sortOrder: category.sortOrder ?? 0,
    depth: 0,
    childrenCount,
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
  } satisfies CategoryDetail;
}

export async function createCategory(input: CategoryCreateInput) {
  await connectToDatabase();

  const slug = await generateUniqueSlug(input.slug || input.name);
  const parentCategoryId = input.parentCategory ?? null;

  if (process.env.NODE_ENV === "development") {
    console.log("[categories][service] createCategory input", {
      name: input.name,
      slug: input.slug,
      resolvedSlugBase: input.slug || input.name,
      parentCategoryId,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    });
  }

  if (parentCategoryId) {
    await validateParentCategory(parentCategoryId);
  }

  const category = await CategoryModel.create({
    name: normalizeText(input.name),
    slug,
    description: normalizeOptionalText(input.description),
    image: normalizeOptionalText(input.image),
    parentCategory: toObjectId(parentCategoryId),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
    status: input.isActive === false ? "inactive" : "active",
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[categories][service] MongoDB create result", {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      parentCategory: category.parentCategory?.toString() ?? null,
    });
  }

  return getCategoryById(category._id.toString());
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  await connectToDatabase();

  const category = await CategoryModel.findById(id);

  if (!category) {
    return null;
  }

  if (input.name !== undefined) {
    category.name = normalizeText(input.name);
  }

  if (input.slug !== undefined) {
    category.slug = await generateUniqueSlug(input.slug, id);
  }

  if (input.description !== undefined) {
    category.description = normalizeOptionalText(input.description);
  }

  if (input.image !== undefined) {
    category.image = normalizeOptionalText(input.image);
  }

  if (input.parentCategory !== undefined) {
    if (input.parentCategory === null) {
      category.parentCategory = null;
    } else {
      await validateParentCategory(input.parentCategory, id);
      category.parentCategory = toObjectId(input.parentCategory);
    }
  }

  if (input.sortOrder !== undefined) {
    category.sortOrder = input.sortOrder;
  }

  if (input.isActive !== undefined) {
    category.isActive = input.isActive;
    category.status = input.isActive ? "active" : "inactive";
  }

  const savedCategory = await category.save();
  return getCategoryById(savedCategory._id.toString());
}

export async function deleteCategory(id: string) {
  await connectToDatabase();

  const records = await loadCategoryRecords();
  const category = records.find((record) => record._id.toString() === id);

  if (!category) {
    return null;
  }

  const descendantIds = await getDescendantIds(id, records);
  const categoryIds = [id, ...descendantIds].map((value) => new Types.ObjectId(value));

  const productExists = await ProductModel.exists({
    $or: [{ category: { $in: categoryIds } }, { subCategory: { $in: categoryIds } }],
  });

  if (productExists) {
    throw new Error("Category cannot be deleted because products are assigned to it or its descendants");
  }

  const savedCategory = await CategoryModel.findByIdAndUpdate(
    id,
    {
      $set: {
        isActive: false,
        status: "inactive",
      },
    },
    { new: true }
  );

  return savedCategory ? getCategoryById(savedCategory._id.toString()) : null;
}