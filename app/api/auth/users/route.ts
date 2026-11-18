import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const userResult = await requirePermission(req, [PERMISSIONS.POSTS_MANAGE, PERMISSIONS.USERS_MANAGE]);
        if (userResult instanceof NextResponse) {
            return userResult; // Error response
        }

        const userId = userResult.id;
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized. Please login to perform changes" },
                { status: 401 }
            );
        }

        const users = await prisma.user.findMany({
            select: { id: true, username: true },
            orderBy: { username: "asc" },
        });

        const formattedUsers = users.map((user) => ({
            _id: user.id,
            id: user.id,
            username: user.username,
        }));

        return NextResponse.json({
            success: true,
            users: formattedUsers
        });

    } catch (error) {
        console.error("Get users error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch users." },
            { status: 500 }
        );
    }
}
