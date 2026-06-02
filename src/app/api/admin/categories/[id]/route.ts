import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { getCategoryById, updateCategory, deleteCategory } from "@/services/categories";
import { categoryUpdateSchema } from "@/validations/category";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function ensureAdminAccess() {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return { error: NextResponse.json(createErrorResponse("You must be signed in"), { status: 401 }) };
  }

  if (!isStaffOrAbove(currentUser)) {
    return { error: NextResponse.json(createErrorResponse("You do not have permission to manage categories"), { status: 403 }) };
  }

  return { currentUser };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const id = resolvedParams.id?.trim();

  if (!id) {
    return NextResponse.json(createErrorResponse("Category id is required"), { status: 400 });
  }

  const category = await getCategoryById(id);

  if (!category) {
    return NextResponse.json(createErrorResponse("Category not found"), { status: 404 });
  }

  return NextResponse.json(createSuccessResponse(category));
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const resolvedParams = await params;
  const id = resolvedParams.id?.trim();

  if (!id) {
    return NextResponse.json(createErrorResponse("Category id is required"), { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = categoryUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(createErrorResponse("Invalid payload", parsed.error.message), { status: 400 });
  }

  try {
    const updated = await updateCategory(id, parsed.data);

    if (!updated) {
      return NextResponse.json(createErrorResponse("Category not found"), { status: 404 });
    }

    return NextResponse.json(createSuccessResponse(updated, "Category updated"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update category";
    return NextResponse.json(createErrorResponse("Failed to update category", message), { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const resolvedParams = await params;
  const id = resolvedParams.id?.trim();

  if (!id) {
    return NextResponse.json(createErrorResponse("Category id is required"), { status: 400 });
  }

  try {
    const deleted = await deleteCategory(id);

    if (!deleted) {
      return NextResponse.json(createErrorResponse("Category not found"), { status: 404 });
    }

    return NextResponse.json(createSuccessResponse(deleted, "Category removed"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove category";
    return NextResponse.json(createErrorResponse("Failed to remove category", message), { status: 500 });
  }
}
