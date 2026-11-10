import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const userResult = await getCurrentUser(req);
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

    } catch (error: any) {
        console.error("Get users error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch users." },
            { status: 500 }
        );
    }
}
