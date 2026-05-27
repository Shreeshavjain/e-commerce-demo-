import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { uploadProductImages } from "@/services/uploads";
import { validateProductImageFiles } from "@/validations/upload";

export const runtime = "nodejs";

function readOptionalTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAuthenticatedUser();

  if (!currentUser) {
    return NextResponse.json(createErrorResponse("You must be signed in to upload product images"), {
      status: 401,
    });
  }

  if (!isStaffOrAbove(currentUser)) {
    return NextResponse.json(createErrorResponse("You do not have permission to upload product images"), {
      status: 403,
    });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(createErrorResponse("A multipart form upload is required"), {
      status: 400,
    });
  }

  const uploadedFiles = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  const { files: validFiles, issues } = validateProductImageFiles(uploadedFiles);

  if (issues.length > 0) {
    return NextResponse.json(
      createErrorResponse(
        "Invalid product image upload",
        issues.map((issue) => `${issue.fileName}: ${issue.message}`).join("; ")
      ),
      { status: 400 }
    );
  }

  const productSlug = readOptionalTextField(formData, "productSlug");
  const colorName = readOptionalTextField(formData, "colorName");
  const variantId = readOptionalTextField(formData, "variantId");
  const folder = readOptionalTextField(formData, "folder");

  try {
    const uploads = await uploadProductImages({
      files: validFiles,
      productSlug: productSlug || undefined,
      colorName: colorName || undefined,
      variantId: variantId || undefined,
      folder: folder || undefined,
    });

    return NextResponse.json(
      createSuccessResponse(
        {
          uploads,
          folder: uploads[0]?.folder ?? null,
          count: uploads.length,
        },
        "Product images uploaded successfully"
      ),
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload product images";
    return NextResponse.json(createErrorResponse("Product image upload failed", message), {
      status: 500,
    });
  }
}