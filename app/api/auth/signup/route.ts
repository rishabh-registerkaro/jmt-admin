import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
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
  } catch (error: any) {
    if (error.code === "P2002") {
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
