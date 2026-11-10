import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./getCurrentUser";
import { ADMIN_ROLES } from "../constants/role"

export interface UserWithRole {
    id: string;
    username: string;
    role: string;
}

/**
 * Check if user has one of the allowed roles
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
}


/**
 * Check if user is admin (superadmin or admin)
 */
export function isAdmin(userRole: string): boolean {
    return ADMIN_ROLES.includes(userRole as "admin");
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(userRole: string): boolean {
    return userRole === "superadmin";
}

/**
 * Require user to have one of the allowed roles
 * Returns user object if authorized, NextResponse error if not
 */
export async function requireRole(req: NextRequest, allowedRoles: string[]): Promise<UserWithRole | NextResponse> {
    const userResult = await getCurrentUser(req);
    if (userResult instanceof NextResponse) {
        return userResult; // Already an error response
    }

    const user = userResult as UserWithRole;

    if (!hasRole(user.role, allowedRoles)) {
        return NextResponse.json({
            success: false,
            message: "Access denied. You don't have permission to access this resource."
        }, { status: 403 })
    }


    return user;
}

/**
 * Get user role from request
 */
export async function getUserRole(req: NextRequest): Promise<string | null>{
    const userResult = await getCurrentUser(req);

    if (userResult instanceof NextResponse) {
        return null;
      }
    
      return (userResult as UserWithRole).role;
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userRole: string, route: string): boolean {
  const contentRoutes = [
    "/api/post",
    "/api/media",
    "/api/header-menu",
    "/api/footer-menu",
    "/api/about",
  ];

  if (isAdmin(userRole)) {
    return true;
  }

  if (userRole === "editor" || userRole === "contributor") {
    return contentRoutes.some((r) => route.startsWith(r));
  }

  return false;
}