import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { issueSession } from "@/app/lib/utils/session";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!password || (!email && !username)) {
      return NextResponse.json(
        {
          message:
            "Please provide either email or username along with password",
        },
        { status: 400 }
      );
    }
    // Fetch WITH password (needed for bcrypt comparison); never returned to client
    // Emails are stored lowercased (signup/users routes) — match that here.
    const user = await prisma.user.findUnique({
      where: email ? { email: String(email).toLowerCase().trim() } : { username },
    });

    // Same response for unknown account and wrong password, so the login form
    // can't be used to discover which emails/usernames exist.
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      message: "Login successfull",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });

    // Short-lived, sliding session: kept alive by /api/auth/refresh while the
    // admin is active (components/common/SessionTimeout.tsx).
    issueSession(response, user, Date.now());

    return response;


  } catch (error) {
    console.log("Error message", error)
    return NextResponse.json(
        { message: " Internal Server Error-Login Api failed"},
        { status: 500 }
    )
  }
}
