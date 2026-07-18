import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, isCustomerProtectedPath } from "@/server/auth/route-config";

// Proxy is the Next.js 16 replacement for middleware. It acts as a first-line route gate for protected areas.
// Server handlers still verify the session cookie authoritatively before returning sensitive data.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isCustomerProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/orders/:path*"],
};