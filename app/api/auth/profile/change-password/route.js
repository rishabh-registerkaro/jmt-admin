import { NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";
import { issueSession, tokenSessionStart } from "@/app/lib/utils/session";

export async function PUT(req) {
    try {
        const userResult = await getCurrentUser(req);
        if (userResult instanceof NextResponse) {
            return userResult;
        }
        const userId = userResult.id;
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please login to change password."
            }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;


        // Validate required fields
        // Non-string values would skip the length check and make bcrypt throw (500)
        if (
            !currentPassword || !newPassword ||
            typeof currentPassword !== "string" || typeof newPassword !== "string"
        ) {
            return NextResponse.json({
                success: false,
                message: "Current password and new password are required",
            }, { status: 400 });
        }

        // Validate new password length
        if (newPassword.length < 8) {
            return NextResponse.json({
                success: false,
                message: "New password must be at least 8 characters long",
            }, { status: 400 });
        }

        // Fetch WITH password (needed for comparison); never returned to client
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, role: true, password: true },
        });
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return NextResponse.json({
                success: false,
                message: "Current password is incorrect",
            }, { status: 401 });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json({
                success: false,
                message: "New password must be different from current password",
            }, { status: 400 });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        const response = NextResponse.json({
            success: true,
            message: "Password changed successfully.",
        }, { status: 200 });
        // The new hash ends every older session (session.ts → passwordVersion);
        // keep this one signed in, with the same session start (12-hour cap).
        const current = jwt.decode(req.cookies.get("authToken")?.value ?? "");
        const sessionStart = current && typeof current === "object" ? tokenSessionStart(current) : Date.now();
        issueSession(response, { ...user, password: hashedNewPassword }, sessionStart);
        return response;

    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to update password",
            },
            { status: 500 }
        );

    }
}
