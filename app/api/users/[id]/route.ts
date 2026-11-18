import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/config/db";
import bcrypt from "bcrypt";

import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import {
    canAssignRole,
    resolveRequestedRole,
    resolveUserAccess,
    userRoleView,
} from "@/app/lib/server/rbac";

const roleSelect = { select: { id: true, key: true, name: true, permissions: true } } as const;

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const userResult = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
        if (userResult instanceof NextResponse) {
            return userResult;
        }

        const userId = userResult.id;
        if (!userId) {
            return NextResponse.json({
                success: false, message: "Unauthorized User Access",
            }, { status: 401 })
        }

        const { id } = await context.params;

        // Validate ID format
        if (!(typeof id === "string" && id.length > 0)) {
            return NextResponse.json({
                success: false,
                message: "Invalid User ID format"
            }, { status: 400 });
        }

        // Fetch the user (excluding password)
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, role: true, roleId: true, adminRole: roleSelect },
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 })
        }

        const formattedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            ...(await userRoleView(user, userResult)),
        }

        return NextResponse.json({
            success: true,
            user: formattedUser
        }, { status: 200 })
    } catch (error) {
        console.error("Get user by ID error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch user details." },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const userResult = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
        if (userResult instanceof NextResponse) {
            return userResult;
        }

        const currentUser = userResult;
        const { id } = await context.params;

        // validate id format
        if (!(typeof id === "string" && id.length > 0)) {
            return NextResponse.json({
                success: false,
                message: "Invalid User ID format"
            }, { status: 400 })
        }

        // check query parameter for password update flag
        const { searchParams } = new URL(req.url);
        const updatePassword = searchParams.get("updatePassword") === "true";

        const body = await req.json();
        const { newPassword, currentPassword } = body;

        // Fetched WITH password (needed for password-update comparison);
        // the password is never returned to the client.
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, role: true, password: true, roleId: true, adminRole: roleSelect },
        });

        if (!targetUser) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 })
        }

        // checking if user is trying to change their own data
        const isChangingOwnData = currentUser.id === id;
        const targetAccess = await resolveUserAccess(targetUser);
        // May the current user manage someone holding the target's role?
        const outranksTarget = canAssignRole(currentUser, { key: targetAccess.roleKey, permissions: targetAccess.permissions });

        // ========== PASSWORD UPDATE LOGIC ==========
        if (updatePassword) {
            // validate new password is provided
            if (!newPassword) {
                return NextResponse.json({
                    success: false,
                    message: "New password is required"
                }, { status: 400 })
            }

            // validate new password length
            if (typeof newPassword !== "string" || newPassword.length < 8) {
                return NextResponse.json({
                    success: false,
                    message: "New password must be at least 8 characters"
                }, { status: 400 })
            }

            // Security check: you may only reset passwords of users whose role you
            // could assign yourself — otherwise an admin could reset another
            // admin's (or a super admin's) password and log in as them.
            if (!isChangingOwnData && !outranksTarget) {
                return NextResponse.json({
                    success: false,
                    message: "You don't have permission to change this user's password"
                }, { status: 403 })
            }

            // If changing own password, require and verify current password
            if (isChangingOwnData) {
                if (!currentPassword) {
                    return NextResponse.json({
                        success: false,
                        message: "Current password is required when changing your own password"
                    }, { status: 400 })
                }

                // Verify current password
                const isCurrentPasswordValid = await bcrypt.compare(currentPassword, targetUser.password);
                if (!isCurrentPasswordValid) {
                    return NextResponse.json({
                        success: false,
                        message: "Current password is incorrect"
                    }, { status: 401 })
                }

                // Check if new password is same as current password
                const isSamePassword = await bcrypt.compare(newPassword, targetUser.password);
                if (isSamePassword) {
                    return NextResponse.json({
                        success: false,
                        message: "New password must be different from current password"
                    }, { status: 400 })
                }
            }
            // Note: When changing another user's password, we don't need current password verification

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await prisma.user.update({
                where: { id },
                data: { password: hashedNewPassword },
            });

            return NextResponse.json({
                success: true,
                message: "Password updated successfully"
            }, { status: 200 })
        }
        // ========== ROLE UPDATE LOGIC ==========
        else {
            // validate role is provided (roleId; legacy `role` string still accepted)
            if (!body.roleId && !body.role) {
                return NextResponse.json({
                    success: false,
                    message: "Role is required"
                }, { status: 400 })
            }

            const newRole = await resolveRequestedRole(body);
            if (!newRole) {
                return NextResponse.json({
                    success: false,
                    message: "Invalid role."
                }, { status: 400 })
            }

            // Prevent users from changing their own role
            if (isChangingOwnData) {
                return NextResponse.json({
                    success: false,
                    message: "You cannot change your own role"
                }, { status: 403 })
            }

            // security check: you can't change the role of someone you don't outrank
            if (!outranksTarget) {
                return NextResponse.json({
                    success: false,
                    message: "You don't have permission to change this user's role"
                }, { status: 403 })
            }

            // Nobody can hand out Super Admin, only the Super Admin can hand out Admin
            // (users.manage) roles, and nobody can grant permissions they don't hold.
            if (!canAssignRole(currentUser, newRole)) {
                return NextResponse.json({
                    success: false,
                    message: `You don't have permission to assign the ${newRole.name} role`
                }, { status: 403 })
            }

            // update the user's role (legacy column kept in sync for the shared users table)
            const updatedUser = await prisma.user.update({
                where: { id },
                data: { role: newRole.legacy, roleId: newRole.id },
                select: { id: true, username: true, email: true, role: true, roleId: true, adminRole: roleSelect },
            });

            return NextResponse.json({
                success: true,
                message: "User role updated successfully",
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    ...(await userRoleView(updatedUser, currentUser)),
                }
            }, { status: 200 })
        }
    } catch (error) {
        console.error("Update user error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to update user." },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[id] — users.manage, and only users whose role the caller
 * could assign (an Admin can remove Editors / Leads Managers; only a Super
 * Admin can remove Admins). The Super Admin account can never be deleted.
 * Content authored by the removed user (posts, service pages, package blocks,
 * JMT service pages) is reassigned to the user performing the delete,
 * so nothing is lost and the required author foreign keys stay valid.
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const userResult = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
        if (userResult instanceof NextResponse) {
            return userResult;
        }

        const currentUser = userResult;
        const { id } = await context.params;

        if (!(typeof id === "string" && id.length > 0)) {
            return NextResponse.json({
                success: false,
                message: "Invalid User ID format"
            }, { status: 400 });
        }

        if (currentUser.id === id) {
            return NextResponse.json({
                success: false,
                message: "You cannot delete your own account"
            }, { status: 403 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, roleId: true, adminRole: roleSelect },
        });

        if (!targetUser) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        const targetAccess = await resolveUserAccess(targetUser);

        if (targetAccess.isSuperAdmin) {
            return NextResponse.json({
                success: false,
                message: "Super Admin accounts cannot be deleted"
            }, { status: 403 });
        }

        if (!canAssignRole(currentUser, { key: targetAccess.roleKey, permissions: targetAccess.permissions })) {
            return NextResponse.json({
                success: false,
                message: "You don't have permission to delete this user"
            }, { status: 403 });
        }

        const reassign = { where: { authorId: id }, data: { authorId: currentUser.id } };
        await prisma.$transaction([
            prisma.post.updateMany(reassign),
            prisma.servicePage.updateMany(reassign),
            prisma.packageBlock.updateMany(reassign),
            prisma.jmtServicePage.updateMany(reassign),
            prisma.user.delete({ where: { id } }),
        ]);

        return NextResponse.json({
            success: true,
            message: "User deleted successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("Delete user error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to delete user." },
            { status: 500 }
        );
    }
}
