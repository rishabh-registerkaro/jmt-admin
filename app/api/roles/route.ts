import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import {
  PERMISSIONS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_KEYS,
  sanitizeGrantable,
} from "@/app/lib/constants/permissions";
import { canAssignRole, rolePermissions } from "@/app/lib/server/rbac";
import { errorFields } from "@/app/lib/utils/errorFields";

const SYSTEM_ORDER: string[] = SYSTEM_ROLES.map((r) => r.key);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * GET /api/roles — every role with its user count.
 * users.manage or roles.manage. `?assignable=1` keeps only the roles the caller
 * may assign (used by the Users screen's role picker).
 */
export async function GET(req: NextRequest) {
  const user = await requirePermission(req, [PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE]);
  if (user instanceof NextResponse) return user;

  try {
    const assignableOnly = new URL(req.url).searchParams.get("assignable") === "1";

    const rows = await prisma.adminRole.findMany({
      select: {
        id: true, key: true, name: true, description: true, permissions: true, isSystem: true,
        createdAt: true, updatedAt: true, _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    let roles = rows.map((r) => {
      const permissions = rolePermissions(r);
      return {
        id: r.id,
        key: r.key,
        name: r.name,
        description: r.description,
        permissions,
        isSystem: r.isSystem,
        locked: r.key === SYSTEM_ROLE_KEYS.SUPERADMIN,
        userCount: r._count.users,
        assignable: canAssignRole(user, { key: r.key, permissions }),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    // System roles first in their canonical order, then custom roles by creation date.
    roles.sort((a, b) => {
      const ai = SYSTEM_ORDER.indexOf(a.key);
      const bi = SYSTEM_ORDER.indexOf(b.key);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return 0;
    });

    if (assignableOnly) roles = roles.filter((r) => r.assignable);

    return NextResponse.json({
      success: true,
      roles,
      // Roles haven't been seeded yet (npm run seed:roles) — the UI shows a hint.
      seeded: rows.some((r) => r.key === SYSTEM_ROLE_KEYS.SUPERADMIN),
    });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch roles." }, { status: 500 });
  }
}

/** POST /api/roles — create a custom role (roles.manage). Body: { name, description?, permissions: string[] } */
export async function POST(req: NextRequest) {
  const user = await requirePermission(req, PERMISSIONS.ROLES_MANAGE);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 255) : "";
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ success: false, message: "Role name must be 2–80 characters." }, { status: 400 });
    }

    const permissions = sanitizeGrantable(body.permissions);
    if (permissions.length === 0) {
      return NextResponse.json({ success: false, message: "Pick at least one permission." }, { status: 400 });
    }

    if (await prisma.adminRole.findFirst({ where: { name }, select: { id: true } })) {
      return NextResponse.json({ success: false, message: "A role with that name already exists." }, { status: 409 });
    }

    const base = slugify(name) || "role";
    if ((SYSTEM_ORDER as string[]).includes(base)) {
      return NextResponse.json({ success: false, message: "That name is reserved for a built-in role." }, { status: 409 });
    }
    // Unique key: base, base-2, base-3…
    let key = base;
    for (let n = 2; await prisma.adminRole.findUnique({ where: { key }, select: { id: true } }); n++) {
      key = `${base}-${n}`;
    }

    const role = await prisma.adminRole.create({
      data: { key, name, description: description || null, permissions, isSystem: false },
    });

    return NextResponse.json({ success: true, message: "Role created", role: { ...role, permissions } }, { status: 201 });
  } catch (error) {
    console.error("Create role error:", error);
    if (errorFields(error).code === "P2002") {
      return NextResponse.json({ success: false, message: "A role with that name already exists." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Failed to create role." }, { status: 500 });
  }
}
