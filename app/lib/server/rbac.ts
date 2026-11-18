// Role-based access control: resolves a user's role + permissions and holds the
// anti-escalation rules used by the users and roles APIs. Server-only.

import prisma from "@/app/lib/config/db";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  SYSTEM_ROLE_KEYS,
  legacyRoleFor,
  legacyRoleToSystemKey,
  sanitizeGrantable,
  systemRoleDef,
  type AccessInfo,
  type Permission,
} from "@/app/lib/constants/permissions";

export interface RoleRow {
  id: string;
  key: string;
  name: string;
  permissions: unknown;
}

/** Effective permissions of a stored role. Super Admin always gets everything. */
export function rolePermissions(role: Pick<RoleRow, "key" | "permissions">): Permission[] {
  if (role.key === SYSTEM_ROLE_KEYS.SUPERADMIN) return [...ALL_PERMISSIONS];
  return sanitizeGrantable(role.permissions);
}

/**
 * Resolves what a user may do.
 * - roleId set → that role's permissions.
 * - roleId null (not yet backfilled by `npm run seed:roles`, or a user created
 *   by the Global Elite site) → the system role matching the legacy enum,
 *   using the stored copy if seeded so edits to Editor/Admin still apply.
 */
export async function resolveUserAccess(
  user: {
    role: string;
    roleId?: string | null;
    adminRole?: RoleRow | null;
  },
  /** Preloaded system roles (see loadSystemRoleMap) — avoids a query per user in lists. */
  systemRoles?: Map<string, RoleRow>,
): Promise<AccessInfo> {
  let role: RoleRow | null = user.adminRole ?? null;

  if (!role) {
    const key = legacyRoleToSystemKey(user.role);
    const stored = systemRoles
      ? systemRoles.get(key) ?? null
      : await prisma.adminRole.findUnique({
          where: { key },
          select: { id: true, key: true, name: true, permissions: true },
        });
    if (stored) {
      role = stored;
    } else {
      const def = systemRoleDef(key)!;
      role = { id: "", key: def.key, name: def.name, permissions: [...def.permissions] };
    }
  }

  const permissions = rolePermissions(role);
  return {
    role: user.role,
    roleId: user.adminRole ? role.id : user.roleId ?? null,
    roleKey: role.key,
    roleName: role.name,
    permissions,
    isSuperAdmin: role.key === SYSTEM_ROLE_KEYS.SUPERADMIN,
  };
}

export const userAccessSelect = {
  id: true,
  username: true,
  role: true,
  roleId: true,
  adminRole: { select: { id: true, key: true, name: true, permissions: true } },
} as const;

export interface AccessActor {
  id: string;
  isSuperAdmin: boolean;
  permissions: readonly string[];
}

/**
 * Can `actor` give `target` role to someone (or manage a user who holds it)?
 * - Super Admin role: nobody. There is exactly one Super Admin account, so the
 *   role can't be handed out and its holder can't be demoted, deleted or reset.
 * - Super Admin: any other role.
 * - Others: never a role that can manage users (so only the Super Admin can
 *   create admins), and only roles whose permissions are all ones the actor has.
 */
export function canAssignRole(actor: AccessActor, target: { key: string; permissions: readonly string[] }): boolean {
  if (target.key === SYSTEM_ROLE_KEYS.SUPERADMIN) return false;
  if (actor.isSuperAdmin) return true;
  if (target.permissions.includes(PERMISSIONS.USERS_MANAGE)) return false;
  if (target.permissions.includes(PERMISSIONS.ROLES_MANAGE)) return false;
  return target.permissions.every((p) => actor.permissions.includes(p));
}

/** Loads a role by id with its effective permissions, or null. */
export async function findRole(id: string) {
  const role = await prisma.adminRole.findUnique({
    where: { id },
    select: { id: true, key: true, name: true, description: true, permissions: true, isSystem: true },
  });
  if (!role) return null;
  return { ...role, permissions: rolePermissions(role) };
}

export async function loadSystemRoleMap(): Promise<Map<string, RoleRow>> {
  const rows = await prisma.adminRole.findMany({
    where: { isSystem: true },
    select: { id: true, key: true, name: true, permissions: true },
  });
  return new Map(rows.map((r) => [r.key, r]));
}

export interface AssignableRole {
  /** null when roles haven't been seeded yet — only the legacy column is written then. */
  id: string | null;
  key: string;
  name: string;
  permissions: Permission[];
  legacy: "superadmin" | "admin" | "editor";
}

/**
 * Turns a request's `roleId` (new clients) or legacy `role` string (old clients)
 * into the role to assign. Returns null if it doesn't exist.
 */
export async function resolveRequestedRole(input: { roleId?: unknown; role?: unknown }): Promise<AssignableRole | null> {
  if (typeof input.roleId === "string" && input.roleId) {
    const role = await findRole(input.roleId);
    if (!role) return null;
    return { id: role.id, key: role.key, name: role.name, permissions: role.permissions, legacy: legacyRoleFor(role.key, role.permissions) };
  }
  if (typeof input.role === "string" && ["superadmin", "admin", "editor", "contributor"].includes(input.role)) {
    const key = legacyRoleToSystemKey(input.role);
    const stored = await prisma.adminRole.findUnique({
      where: { key },
      select: { id: true, key: true, name: true, permissions: true },
    });
    const def = systemRoleDef(key)!;
    const permissions = stored ? rolePermissions(stored) : [...def.permissions];
    return { id: stored?.id ?? null, key, name: stored?.name ?? def.name, permissions, legacy: def.legacyRole };
  }
  return null;
}

/** Role fields the Users screens show for each user, plus whether `actor` may manage them. */
export async function userRoleView(
  user: { id: string; role: string; roleId?: string | null; adminRole?: RoleRow | null },
  actor: AccessActor,
  systemRoles?: Map<string, RoleRow>,
) {
  const access = await resolveUserAccess(user, systemRoles);
  return {
    role: user.role,
    roleId: access.roleId,
    roleKey: access.roleKey,
    roleName: access.roleName,
    canManage: user.id !== actor.id && canAssignRole(actor, { key: access.roleKey, permissions: access.permissions }),
  };
}
