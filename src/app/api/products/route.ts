import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import { createProduct, listProducts } from "@/services/products";
import { productCreateSchema, productListQuerySchema } from "@/validations/product";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsedQuery = productListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsedQuery.success) {
    return NextResponse.json(createErrorResponse("Invalid product query", parsedQuery.error.message), {
      status: 400,
    });
  }

  const products = await listProducts(parsedQuery.data);
  return NextResponse.json(createSuccessResponse(products, "Products loaded successfully"));
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json(createErrorResponse("You must be signed in to create products"), {
      status: 401,
    });
  }

  if (!isStaffOrAbove(currentUser)) {
    return NextResponse.json(createErrorResponse("You do not have permission to create products"), {
      status: 403,
    });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = productCreateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(createErrorResponse("Invalid product payload", parsedBody.error.message), {
      status: 400,
    });
  }

  try {
    const product = await createProduct(parsedBody.data, currentUser.id);
    return NextResponse.json(createSuccessResponse(product, "Product created successfully"), {
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create product";
    return NextResponse.json(createErrorResponse("Failed to create product", message), {
      status: 500,
    });
  }
}