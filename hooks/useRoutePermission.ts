"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getUserProfile, UserProfile } from "@/lib/apiCallingProfile";
import { ADMIN_ROLES } from "@/app/lib/constants/role";

// Define route-to-role mapping
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard/leads": ADMIN_ROLES,
  "/dashboard/users": ADMIN_ROLES,
  "/dashboard/terms-policy": ADMIN_ROLES,
  "/dashboard/services": ADMIN_ROLES,
  "/dashboard/services/create-service": ADMIN_ROLES,
  "/dashboard/services/update-service": ADMIN_ROLES, // This will match any update-service route
  "/dashboard/packages": ADMIN_ROLES,
  "/dashboard/packages/create-package": ADMIN_ROLES,
  "/dashboard/packages/update-package": ADMIN_ROLES,
  "/dashboard/blog": ["superadmin", "admin", "editor", "contributor"],
  "/dashboard/blog/create-blog": ["superadmin", "admin", "editor"],
  "/dashboard/blog/update-blog": ["superadmin", "admin", "editor"],
  "/dashboard/blog/category": ["superadmin", "admin", "editor"],
  "/dashboard/media": ["superadmin", "admin", "editor", "contributor"],
  "/dashboard/header-menu": ["superadmin", "admin", "editor", "contributor"],
  "/dashboard/footer-menu": ["superadmin", "admin", "editor", "contributor"],
  "/dashboard/about": ["superadmin", "admin", "editor", "contributor"],
  "/dashboard/profile": ["superadmin", "admin", "editor", "contributor"],
};

/**
 * Check if a route matches a pattern (handles dynamic routes)
 */
function matchesRoute(pathname: string, routePattern: string): boolean {
  // Exact match
  if (pathname === routePattern) return true;
  
  // Pattern matching for dynamic routes
  // e.g., "/dashboard/services/update-service/[id]" matches "/dashboard/services/update-service/123"
  const patternParts = routePattern.split("/");
  const pathParts = pathname.split("/");
  
  if (patternParts.length !== pathParts.length) return false;
  
  return patternParts.every((part, index) => {
    // If pattern part is a dynamic segment (starts with [), match any value
    if (part.startsWith("[") && part.endsWith("]")) return true;
    return part === pathParts[index];
  });
}

export function useRoutePermission() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const response = await getUserProfile();
        
        if (response.success && response.user) {
          setUser(response.user);
          
          // Find matching route permission
          let requiredRoles: string[] | undefined;
          
          // First try exact match
          if (ROUTE_PERMISSIONS[pathname]) {
            requiredRoles = ROUTE_PERMISSIONS[pathname];
          } else {
            // Try pattern matching for dynamic routes
            for (const [routePattern, roles] of Object.entries(ROUTE_PERMISSIONS)) {
              if (matchesRoute(pathname, routePattern)) {
                requiredRoles = roles;
                break;
              }
            }
          }
          
          // If no specific permission defined, allow access (for routes like /dashboard)
          if (!requiredRoles) {
            setHasAccess(true);
            return;
          }
          
          // Check if user role is in required roles
          const userHasAccess = requiredRoles.includes(response.user.role);
          setHasAccess(userHasAccess);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error checking route permission:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [pathname]);

  return { user, loading, hasAccess };
}