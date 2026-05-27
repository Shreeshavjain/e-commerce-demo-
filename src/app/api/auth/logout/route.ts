import { NextResponse } from "next/server";
import { clearAuthSession } from "@/server/auth/session";
import { createAuthActionResponse } from "@/server/auth/auth-response";

export async function POST() {
  // Logout is a server-side cookie destroy operation so the browser can no longer present the active session.
  await clearAuthSession();

  return NextResponse.json(createAuthActionResponse("Signed out successfully"));
}