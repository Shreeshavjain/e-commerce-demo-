import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { archiveProduct, updateProduct } from "@/services/products";
import { productCreateSchema } from "@/validations/product";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function ensureAdminAccess() {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return { error: NextResponse.json(createErrorResponse("You must be signed in"), { status: 401 }) };
  }

  if (!isStaffOrAbove(currentUser)) {
    return { error: NextResponse.json(createErrorResponse("You do not have permission to manage products"), { status: 403 }) };
  }

  return { currentUser };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const resolvedParams = await params;
  const productId = resolvedParams.id?.trim();

  if (!productId) {
    return NextResponse.json(createErrorResponse("Product id is required"), { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = productCreateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(createErrorResponse("Invalid product payload", parsedBody.error.message), { status: 400 });
  }

  try {
    const product = await updateProduct(productId, parsedBody.data);

    if (!product) {
      return NextResponse.json(createErrorResponse("Product not found"), { status: 404 });
    }

    return NextResponse.json(createSuccessResponse(product, "Product updated successfully"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product";
    return NextResponse.json(createErrorResponse("Failed to update product", message), { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const resolvedParams = await params;
  const productId = resolvedParams.id?.trim();

  if (!productId) {
    return NextResponse.json(createErrorResponse("Product id is required"), { status: 400 });
  }

  try {
    const product = await archiveProduct(productId);

    if (!product) {
      return NextResponse.json(createErrorResponse("Product not found"), { status: 404 });
    }

    return NextResponse.json(createSuccessResponse(product, "Product archived successfully"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive product";
    return NextResponse.json(createErrorResponse("Failed to archive product", message), { status: 500 });
  }
}