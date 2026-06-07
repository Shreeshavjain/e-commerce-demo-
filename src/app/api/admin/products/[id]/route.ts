import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import {
  archiveProduct,
  publishProduct,
  restoreProduct,
  unpublishProduct,
  updateProduct,
} from "@/services/products";
import { productCreateSchema, productPublicationActionSchema } from "@/validations/product";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const publicationActionMessages = {
  publish: "Product published",
  unpublish: "Product unpublished",
  archive: "Product archived",
  restore: "Product restored",
} as const;

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
  const publicationAction = productPublicationActionSchema.safeParse(body);

  if (publicationAction.success) {
    try {
      const action = publicationAction.data.action;
      const product =
        action === "publish"
          ? await publishProduct(productId)
          : action === "unpublish"
            ? await unpublishProduct(productId)
            : action === "archive"
              ? await archiveProduct(productId)
              : await restoreProduct(productId);

      if (!product) {
        return NextResponse.json(createErrorResponse("Product not found"), { status: 404 });
      }

      return NextResponse.json(createSuccessResponse(product, publicationActionMessages[action]));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update product status";
      return NextResponse.json(createErrorResponse("Failed to update product status", message), { status: 500 });
    }
  }

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

    return NextResponse.json(createSuccessResponse(product, "Product archived"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive product";
    return NextResponse.json(createErrorResponse("Failed to archive product", message), { status: 500 });
  }
}
