import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS, SYSTEM_ROLE_KEYS, legacyRoleFor, sanitizeGrantable } from "@/app/lib/constants/permissions";

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/roles/[id] — edit name, description, permissions (roles.manage). Super Admin is locked. */
export async function PUT(req: NextRequest, context: Ctx) {
  const user = await requirePermission(req, PERMISSIONS.ROLES_MANAGE);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const role = await prisma.adminRole.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 });
    if (role.key === SYSTEM_ROLE_KEYS.SUPERADMIN) {
      return NextResponse.json({ success: false, message: "The Super Admin role can't be changed." }, { status: 403 });
    }

    const body = await req.json();
    const data: { name?: string; description?: string | null; permissions?: string[] } = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json({ success: false, message: "Role name must be 2–80 characters." }, { status: 400 });
      }
      if (await prisma.adminRole.findFirst({ where: { name, id: { not: id } }, select: { id: true } })) {
        return NextResponse.json({ success: false, message: "A role with that name already exists." }, { status: 409 });
      }
      data.name = name;
    }
    if (body.description !== undefined) {
      const d = typeof body.description === "string" ? body.description.trim().slice(0, 255) : "";
      data.description = d || null;
    }
    if (body.permissions !== undefined) {
      const permissions = sanitizeGrantable(body.permissions);
      if (permissions.length === 0) {
        return NextResponse.json({ success: false, message: "Pick at least one permission." }, { status: 400 });
      }
      data.permissions = permissions;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.adminRole.update({ where: { id }, data });
      // Keep the shared users.role legacy column roughly in step for custom roles.
      if (data.permissions && !r.isSystem) {
        await tx.user.updateMany({ where: { roleId: id }, data: { role: legacyRoleFor(r.key, data.permissions) } });
      }
      return r;
    });

    return NextResponse.json({ success: true, message: "Role updated", role: updated });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ success: false, message: "Failed to update role." }, { status: 500 });
  }
}

/** DELETE /api/roles/[id] — custom roles only, and only when no user holds them (roles.manage). */
export async function DELETE(req: NextRequest, context: Ctx) {
  const user = await requirePermission(req, PERMISSIONS.ROLES_MANAGE);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const role = await prisma.adminRole.findUnique({
      where: { id },
      select: { id: true, isSystem: true, name: true, _count: { select: { users: true } } },
    });
    if (!role) return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 });
    if (role.isSystem) {
      return NextResponse.json({ success: false, message: "Built-in roles can't be deleted." }, { status: 403 });
    }
    if (role._count.users > 0) {
      return NextResponse.json(
        { success: false, message: `${role._count.users} user(s) still have the ${role.name} role. Move them to another role first.` },
        { status: 409 },
      );
    }

    await prisma.adminRole.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete role." }, { status: 500 });
  }
}
