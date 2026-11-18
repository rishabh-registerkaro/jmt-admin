import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { canAssignRole, resolveRequestedRole } from "@/app/lib/server/rbac";
import { errorFields } from "@/app/lib/utils/errorFields";

// Public self-signup is disabled: accounts are created by admins only.
// Without this guard anyone could POST here, get an account and log in to the
// dashboard. New accounts get the Editor role (or `roleId`, if given and allowed).
export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { username, password } = body;
    // Mongoose schema had lowercase:true on email — normalize on write
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : body.email;

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "All Fields are required" },
        { status: 400 }
      );
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "Username or Email already exists" },
        { status: 409 }
      );
    }

    const role = await resolveRequestedRole(body.roleId ? { roleId: body.roleId } : { role: "editor" });
    if (!role) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }
    if (!canAssignRole(auth, role)) {
      return NextResponse.json(
        { message: `You don't have permission to create ${role.name} accounts` },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        role: role.legacy,
        roleId: role.id,
      },
      select: { id: true },
    });
    return NextResponse.json(
      {
        success:true,
        message: "User registered successfully",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (errorFields(error).code === "P2002") {
      return NextResponse.json(
        { message: "Username or Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error-Signup API failed", success: false },
      { status: 500 }
    );
  }
}
