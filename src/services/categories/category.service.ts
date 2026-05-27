import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { CategoryModel } from "@/models/category";

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategory: string | null;
  isActive: boolean;
  sortOrder: number;
  children: CategoryTreeNode[];
};

type CategoryRecord = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  parentCategory: Types.ObjectId | null;
  isActive: boolean;
  sortOrder: number;
};

function toCategoryNode(category: CategoryRecord): CategoryTreeNode {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parentCategory: category.parentCategory ? category.parentCategory.toString() : null,
    isActive: category.isActive,
    sortOrder: category.sortOrder ?? 0,
    children: [],
  };
}

function sortCategoryNodes(nodes: CategoryTreeNode[]) {
  nodes.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  nodes.forEach((node) => sortCategoryNodes(node.children));
}

export async function listActiveCategoryTree() {
  await connectToDatabase();

  const categories = await CategoryModel.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<CategoryRecord[]>();

  const nodesById = new Map<string, CategoryTreeNode>();

  categories.forEach((category) => {
    nodesById.set(category._id.toString(), toCategoryNode(category));
  });

  const roots: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    const node = nodesById.get(category._id.toString());

    if (!node) {
      return;
    }

    if (category.parentCategory) {
      const parentNode = nodesById.get(category.parentCategory.toString());

      if (parentNode) {
        parentNode.children.push(node);
        return;
      }
    }

    roots.push(node);
  });

  sortCategoryNodes(roots);
  return roots;
}
