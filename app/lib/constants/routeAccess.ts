// Admin site map: which dashboard page needs which permission.
// Used by useRoutePermission (AccessDenied gate). The sidebar declares the same
// permissions on its items. Client-safe.
//
// A route not listed here is open to any signed-in user (/dashboard, /dashboard/profile,
// and any page added later), so new pages never lock people out by accident.
// The APIs behind every page enforce permissions on the server regardless.

import { PERMISSIONS as P, type Permission } from "./permissions";

export type RouteRule = readonly [pattern: string, perm: Permission | readonly Permission[]];

export const ROUTE_ACCESS: readonly RouteRule[] = [
  // Website content
  ["/dashboard/homepage", P.CONTENT_EDIT],
  ["/dashboard/site-pages/[key]", P.CONTENT_EDIT],
  ["/dashboard/site-menus/[part]", P.CONTENT_EDIT],
  ["/dashboard/terms-policy", P.CONTENT_EDIT],
  // Legacy main-website editors (kept reachable by URL)
  ["/dashboard/header-menu", P.CONTENT_EDIT],
  ["/dashboard/footer-menu", P.CONTENT_EDIT],
  ["/dashboard/about", P.CONTENT_EDIT],
  ["/dashboard/contact", P.CONTENT_EDIT],

  ["/dashboard/blog", P.POSTS_MANAGE],
  ["/dashboard/blog/create-blog", P.POSTS_MANAGE],
  ["/dashboard/blog/update-blog", P.POSTS_MANAGE],
  ["/dashboard/blog/category", P.POSTS_MANAGE],
  ["/dashboard/blog/category/[id]", P.POSTS_MANAGE],

  ["/dashboard/services", P.SERVICES_MANAGE],
  ["/dashboard/services/create-service", P.SERVICES_MANAGE],
  ["/dashboard/services/[id]", P.SERVICES_MANAGE],

  ["/dashboard/packages", P.PACKAGES_MANAGE],
  ["/dashboard/packages/create-package", P.PACKAGES_MANAGE],
  ["/dashboard/packages/update-package", P.PACKAGES_MANAGE],

  ["/dashboard/media", P.MEDIA_MANAGE],
  // Either one opens the screen; each section shows only what the user may edit.
  ["/dashboard/seo", [P.SEO_MANAGE, P.SEO_SCRIPTS]],

  // Leads
  ["/dashboard/leads", P.LEADS_VIEW],
  ["/dashboard/applications", P.APPLICATIONS_VIEW],

  // Administration
  ["/dashboard/users", P.USERS_MANAGE],
  ["/dashboard/roles", P.ROLES_MANAGE],
];

function matches(pathname: string, pattern: string): boolean {
  if (pathname === pattern) return true;
  const a = pattern.split("/");
  const b = pathname.split("/");
  if (a.length !== b.length) return false;
  return a.every((part, i) => (part.startsWith("[") && part.endsWith("]")) || part === b[i]);
}

/** Permission(s) required for a dashboard path, or null if any signed-in user may open it. */
export function requiredPermissionFor(pathname: string): Permission | readonly Permission[] | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  // Exact entries win over dynamic ones ("/dashboard/services/create-service" before "[id]").
  const exact = ROUTE_ACCESS.find(([p]) => p === path);
  if (exact) return exact[1];
  const dynamic = ROUTE_ACCESS.find(([p]) => matches(path, p));
  return dynamic ? dynamic[1] : null;
}
