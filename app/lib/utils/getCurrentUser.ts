import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/app/lib/config/db";
import { errorFields } from "@/app/lib/utils/errorFields";
import { resolveUserAccess, userAccessSelect } from "@/app/lib/server/rbac";
import type { Permission } from "@/app/lib/constants/permissions";

export interface CurrentUser {
  id: string;
  username: string;
  /** Legacy users.role enum value — kept for older callers. Use `permissions` for access checks. */
  role: string;
  roleId: string | null;
  roleKey: string;
  roleName: string;
  permissions: Permission[];
  isSuperAdmin: boolean;
}

export const getCurrentUser = async (req: NextRequest): Promise<CurrentUser | NextResponse> => {
  try {
    const token = req.cookies.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login to perform changes" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as {
      id: string;
      username: string;
      role: string;
    };

    // Verify user exists in database — role and permissions always come from
    // the database, never from the token, so role changes apply immediately.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: userAccessSelect,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found. Please login again."
        },
        { status: 401 }
      );
    }

    const access = await resolveUserAccess(user);
    return {
      id: user.id,
      username: user.username,
      ...access,
    };
  } catch (error) {
    // Handle JWT errors
    if (errorFields(error).name === "JsonWebTokenError" || errorFields(error).name === "TokenExpiredError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token. Please login again."
        },
        { status: 401 }
      );
    }

    // Handle other errors
    console.error("getCurrentUser error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed. Please login again."
      },
      { status: 401 }
    );
  }
};
