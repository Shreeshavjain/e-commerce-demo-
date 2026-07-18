export const AUTH_SESSION_COOKIE_NAME = "__session";

export const customerProtectedRoutes = ["/account", "/orders"] as const;
export const adminProtectedRoutes = ["/admin"] as const;

export function isPathProtected(pathname: string, routes: readonly string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAdminPath(pathname: string) {
  return isPathProtected(pathname, adminProtectedRoutes);
}

export function isCustomerProtectedPath(pathname: string) {
  return isPathProtected(pathname, customerProtectedRoutes);
}