import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/current-user";
import { createAuthErrorResponse, createAuthSuccessResponse } from "@/server/auth/auth-response";

export async function GET() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json(createAuthErrorResponse("No active session found"), { status: 401 });
  }

  return NextResponse.json(createAuthSuccessResponse(user, false, "Session active"));
}