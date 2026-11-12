import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { issueSession } from "@/app/lib/utils/session";
import { SESSION_MAX_AGE_MS } from "@/app/lib/constants/session";

// Extends the current admin session (sliding idle timeout). Called by
// components/common/SessionTimeout.tsx while the user is active.
export async function POST(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  if (!token) {
    return NextResponse.json({ message: "Session expired" }, { status: 401 });
  }

  let decoded: { id: string; sessionStart?: number; iat?: number };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as typeof decoded;
  } catch {
    return NextResponse.json({ message: "Session expired" }, { status: 401 });
  }

  // Tokens issued before this feature have no sessionStart; fall back to iat.
  const sessionStart = decoded.sessionStart ?? (decoded.iat ?? 0) * 1000;
  if (Date.now() - sessionStart >= SESSION_MAX_AGE_MS) {
    return NextResponse.json({ message: "Session expired" }, { status: 401 });
  }

  // Re-read the user so a deleted account or changed role takes effect.
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, username: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ message: "Session expired" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const expiresAt = issueSession(response, user, sessionStart);
  // Body is built before issueSession; send expiry in a header instead of rebuilding.
  response.headers.set("x-session-expires-at", String(expiresAt));
  return response;
}
