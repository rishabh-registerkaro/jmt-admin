// Single source of truth for dashboard permissions (RBAC).
// Safe to import from both client components and server code — no server deps.
//
// Roles are stored in the jmt_admin_roles table as a list of these keys.
// The admin site map (which page / API needs which key) is in README.md.

export const PERMISSIONS = {
  CONTENT_EDIT: "content.edit",
  POSTS_MANAGE: "posts.manage",
  SERVICES_MANAGE: "services.manage",
  PACKAGES_MANAGE: "packages.manage",
  MEDIA_MANAGE: "media.manage",
  SEO_MANAGE: "seo.manage",
  SEO_SCRIPTS: "seo.scripts",
  LEADS_VIEW: "leads.view",
  LEADS_MANAGE: "leads.manage",
  APPLICATIONS_VIEW: "applications.view",
  APPLICATIONS_MANAGE: "applications.manage",
  USERS_MANAGE: "users.manage",
  CACHE_RESET: "cache.reset",
  ROLES_MANAGE: "roles.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionGroup = "Website content" | "Leads" | "Administration";

export interface PermissionInfo {
  key: Permission;
  label: string;
  description: string;
  group: PermissionGroup;
  /** Can be ticked on a role in the Roles UI. roles.manage is Super Admin only. */
  grantable: boolean;
  /** Not shown in the Roles UI: the feature isn't linked in this dashboard (main-website only). */
  hidden?: boolean;
}

export const PERMISSION_CATALOG: readonly PermissionInfo[] = [
  { key: PERMISSIONS.CONTENT_EDIT, group: "Website content", grantable: true, label: "Edit website pages", description: "Homepage, About, Contact, Join Our Crew, header/footer menus, Terms & Policy" },
  { key: PERMISSIONS.POSTS_MANAGE, group: "Website content", grantable: true, label: "Manage posts", description: "Main-website blog posts and categories", hidden: true },
  { key: PERMISSIONS.SERVICES_MANAGE, group: "Website content", grantable: true, label: "Manage services", description: "Create, edit and delete service pages" },
  { key: PERMISSIONS.PACKAGES_MANAGE, group: "Website content", grantable: true, label: "Manage packages", description: "Main-website package blocks", hidden: true },
  { key: PERMISSIONS.MEDIA_MANAGE, group: "Website content", grantable: true, label: "Media library", description: "Upload, browse and delete media files" },
  { key: PERMISSIONS.SEO_MANAGE, group: "Website content", grantable: true, label: "SEO & schema", description: "Structured data (JSON-LD) for the whole site and each page" },
  { key: PERMISSIONS.SEO_SCRIPTS, group: "Website content", grantable: true, label: "Tracking & custom scripts", description: "Google Tag Manager ID and custom script snippets. These run code on the live website: give only to trusted admins" },
  { key: PERMISSIONS.LEADS_VIEW, group: "Leads", grantable: true, label: "View leads", description: "See client enquiries" },
  { key: PERMISSIONS.LEADS_MANAGE, group: "Leads", grantable: true, label: "Manage leads", description: "Change status, edit, add and delete enquiries" },
  { key: PERMISSIONS.APPLICATIONS_VIEW, group: "Leads", grantable: true, label: "View applications", description: "See Join Our Crew worker applications" },
  { key: PERMISSIONS.APPLICATIONS_MANAGE, group: "Leads", grantable: true, label: "Manage applications", description: "Change status and delete applications" },
  { key: PERMISSIONS.USERS_MANAGE, group: "Administration", grantable: true, label: "Manage users", description: "Add users, change their role, reset passwords, delete users" },
  { key: PERMISSIONS.CACHE_RESET, group: "Administration", grantable: true, label: "Reset all cache", description: "Purge every cached page on the live website" },
  { key: PERMISSIONS.ROLES_MANAGE, group: "Administration", grantable: false, label: "Manage roles", description: "Create and edit roles — Super Admin only" },
];

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_CATALOG.map((p) => p.key);
export const GRANTABLE_PERMISSIONS: readonly Permission[] = PERMISSION_CATALOG.filter((p) => p.grantable).map((p) => p.key);

/** Permissions that let a user edit some part of the website (used by shared tools: media picker, preview, revalidate). */
export const CONTENT_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.CONTENT_EDIT,
  PERMISSIONS.POSTS_MANAGE,
  PERMISSIONS.SERVICES_MANAGE,
  PERMISSIONS.PACKAGES_MANAGE,
  PERMISSIONS.MEDIA_MANAGE,
  PERMISSIONS.SEO_MANAGE,
];

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (ALL_PERMISSIONS as readonly string[]).includes(value);
}

/** Keeps only known, grantable keys, de-duplicated and in catalog order. */
export function sanitizeGrantable(values: unknown): Permission[] {
  const wanted = new Set(Array.isArray(values) ? values.filter(isPermission) : []);
  return GRANTABLE_PERMISSIONS.filter((p) => wanted.has(p));
}

// ---------------------------------------------------------------------------
// System roles
// ---------------------------------------------------------------------------

export const SYSTEM_ROLE_KEYS = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EDITOR: "editor",
  LEADS: "leads",
} as const;

export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[keyof typeof SYSTEM_ROLE_KEYS];

export interface SystemRoleDef {
  key: SystemRoleKey;
  name: string;
  description: string;
  permissions: readonly Permission[];
  /** Value written to the legacy users.role enum column. */
  legacyRole: "superadmin" | "admin" | "editor";
}

export const SYSTEM_ROLES: readonly SystemRoleDef[] = [
  {
    key: SYSTEM_ROLE_KEYS.SUPERADMIN,
    name: "Super Admin",
    description: "Full access. Manages admins and roles.",
    permissions: ALL_PERMISSIONS,
    legacyRole: "superadmin",
  },
  {
    key: SYSTEM_ROLE_KEYS.ADMIN,
    name: "Admin",
    description: "Everything except managing roles.",
    permissions: GRANTABLE_PERMISSIONS,
    legacyRole: "admin",
  },
  {
    key: SYSTEM_ROLE_KEYS.EDITOR,
    name: "Editor",
    description: "Edits website content: pages, posts, services, packages and media.",
    permissions: [
      PERMISSIONS.CONTENT_EDIT,
      PERMISSIONS.POSTS_MANAGE,
      PERMISSIONS.SERVICES_MANAGE,
      PERMISSIONS.PACKAGES_MANAGE,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.SEO_MANAGE,
    ],
    legacyRole: "editor",
  },
  {
    key: SYSTEM_ROLE_KEYS.LEADS,
    name: "Leads Manager",
    description: "Sees and handles client leads and worker applications.",
    permissions: [
      PERMISSIONS.LEADS_VIEW,
      PERMISSIONS.LEADS_MANAGE,
      PERMISSIONS.APPLICATIONS_VIEW,
      PERMISSIONS.APPLICATIONS_MANAGE,
    ],
    legacyRole: "editor",
  },
];

export function systemRoleDef(key: string | null | undefined): SystemRoleDef | undefined {
  return SYSTEM_ROLES.find((r) => r.key === key);
}

/** Legacy users.role enum value → system role key (contributor merges into editor). */
export function legacyRoleToSystemKey(role: string | null | undefined): SystemRoleKey {
  switch (role) {
    case "superadmin":
      return SYSTEM_ROLE_KEYS.SUPERADMIN;
    case "admin":
      return SYSTEM_ROLE_KEYS.ADMIN;
    default:
      return SYSTEM_ROLE_KEYS.EDITOR;
  }
}

/** Value to store in the legacy users.role column for a given AdminRole. */
export function legacyRoleFor(roleKey: string, permissions: readonly string[]): "superadmin" | "admin" | "editor" {
  const sys = systemRoleDef(roleKey);
  if (sys) return sys.legacyRole;
  return permissions.includes(PERMISSIONS.USERS_MANAGE) ? "admin" : "editor";
}

/** What the client receives about the signed-in user (from /api/auth/profile). */
export interface AccessInfo {
  role: string; // legacy enum value (kept for backwards compatibility)
  roleId: string | null;
  roleKey: string;
  roleName: string;
  permissions: Permission[];
  isSuperAdmin: boolean;
}
