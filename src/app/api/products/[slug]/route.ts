import { NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { getProductBySlug } from "@/services/products";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.trim();

  if (!slug) {
    return NextResponse.json(createErrorResponse("Product slug is required"), { status: 400 });
  }

  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json(createErrorResponse("Product not found"), { status: 404 });
  }

  return NextResponse.json(createSuccessResponse(product, "Product loaded successfully"));
}