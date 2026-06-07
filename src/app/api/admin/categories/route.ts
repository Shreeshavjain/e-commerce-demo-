import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { isStaffOrAbove } from "@/server/auth/role-guards";
import { createErrorResponse, createSuccessResponse } from "@/server/utils/api-response";
import { listCategoryTree, createCategory } from "@/services/categories";
import { categoryCreateSchema } from "@/validations/category";

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

export async function GET() {
  const tree = await listCategoryTree();
  return NextResponse.json(createSuccessResponse(tree));
}

export async function POST(request: Request) {
  const access = await ensureAdminAccess();

  if ("error" in access) {
    return access.error;
  }

  const body = await request.json().catch(() => null);

  if (process.env.NODE_ENV === "development") {
    console.log("[categories][api] POST request body", body);
  }

  const parsed = categoryCreateSchema.safeParse(body);

  if (process.env.NODE_ENV === "development") {
    console.log("[categories][api] validation result", {
      success: parsed.success,
      data: parsed.success ? parsed.data : undefined,
      error: parsed.success ? undefined : parsed.error.flatten(),
    });
  }

  if (!parsed.success) {
    return NextResponse.json(createErrorResponse("Invalid payload", parsed.error.message), { status: 400 });
  }

  try {
    const created = await createCategory(parsed.data);

    if (process.env.NODE_ENV === "development") {
      console.log("[categories][api] createCategory result", created);
    }

    return NextResponse.json(createSuccessResponse(created, "Category created successfully"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create category";

    if (process.env.NODE_ENV === "development") {
      console.error("[categories][api] createCategory failed", message);
    }

    return NextResponse.json(createErrorResponse("Failed to create category", message), { status: 500 });
  }
}
