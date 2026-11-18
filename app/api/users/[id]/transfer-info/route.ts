import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import {
    canAssignRole,
    canReceiveWorkFrom,
    loadSystemRoleMap,
    resolveUserAccess,
    userAccessSelect,
} from "@/app/lib/server/rbac";
import { countOwnedWork, ownsWork } from "@/app/lib/server/userWork";

/**
 * GET /api/users/[id]/transfer-info — what the user owns and who may take it
 * over (same access or more). Used by the delete dialog; same guards as DELETE.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
        if (currentUser instanceof NextResponse) {
            return currentUser;
        }

        const { id } = await context.params;
        const target = await prisma.user.findUnique({ where: { id }, select: userAccessSelect });
        if (!target) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const systemRoles = await loadSystemRoleMap();
        const targetAccess = await resolveUserAccess(target, systemRoles);
        if (
            currentUser.id === id ||
            targetAccess.isSuperAdmin ||
            !canAssignRole(currentUser, { key: targetAccess.roleKey, permissions: targetAccess.permissions })
        ) {
            return NextResponse.json({ success: false, message: "You don't have permission to delete this user" }, { status: 403 });
        }

        const [owned, others] = await Promise.all([
            countOwnedWork(id),
            prisma.user.findMany({ where: { id: { not: id } }, select: userAccessSelect, orderBy: { username: "asc" } }),
        ]);

        const candidates = [];
        for (const user of others) {
            const access = await resolveUserAccess(user, systemRoles);
            if (canReceiveWorkFrom(targetAccess, access)) {
                candidates.push({ id: user.id, username: user.username, roleName: access.roleName });
            }
        }

        return NextResponse.json({ success: true, owned, ownsWork: ownsWork(owned), candidates });
    } catch (error) {
        console.error("User transfer info error:", error);
        return NextResponse.json({ success: false, message: "Failed to load this user's work." }, { status: 500 });
    }
}
