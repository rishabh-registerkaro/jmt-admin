"use client";

import { usePathname } from "next/navigation";
import { usePermissions } from "@/components/common/PermissionsProvider";
import { requiredPermissionFor } from "@/app/lib/constants/routeAccess";

/**
 * Can the signed-in user open the current dashboard page?
 * The page → permission map is app/lib/constants/routeAccess.ts.
 */
export function useRoutePermission() {
  const pathname = usePathname();
  const { user, loading, can } = usePermissions();

  if (loading) return { user, loading: true, hasAccess: false };
  if (!user) return { user, loading: false, hasAccess: false };

  const required = requiredPermissionFor(pathname);
  return { user, loading: false, hasAccess: required === null || can(required) };
}
