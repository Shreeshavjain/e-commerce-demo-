import type { UserRole } from "@/models/constants";
import type { AuthenticatedUser } from "@/types/auth";

const roleHierarchy: Record<UserRole, number> = {
  customer: 1,
  staff: 2,
  admin: 3,
  super_admin: 4,
};

// Role guards keep authorization checks simple and scalable when admin/dashboard routes are added later.
export function hasMinimumRole(user: AuthenticatedUser, minimumRole: UserRole): boolean {
  return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
}

export function isAdminOrAbove(user: AuthenticatedUser): boolean {
  return hasMinimumRole(user, "admin");
}

export function isStaffOrAbove(user: AuthenticatedUser): boolean {
  return hasMinimumRole(user, "staff");
}