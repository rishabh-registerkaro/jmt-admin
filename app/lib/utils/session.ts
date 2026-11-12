import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";
import { SESSION_MAX_AGE_MS, SESSION_TOKEN_TTL_MS } from "@/app/lib/constants/session";

export interface SessionUser {
  id: string;
  username: string;
  role: string;
}

/**
 * Signs a fresh session token and sets the auth cookies on `response`.
 * `sessionStart` (ms epoch) is carried across refreshes so SESSION_MAX_AGE_MS can be enforced.
 * Returns the ms epoch at which this token expires.
 */
export function issueSession(response: NextResponse, user: SessionUser, sessionStart: number): number {
  const now = Date.now();
  // Never extend past the absolute cap.
  const ttlMs = Math.min(SESSION_TOKEN_TTL_MS, sessionStart + SESSION_MAX_AGE_MS - now);
  const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, sessionStart },
    process.env.JWT_SECRET!,
    { expiresIn: ttlSeconds }
  );

  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("authToken", token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: ttlSeconds,
    path: "/",
  });
  // UI hint only (components/common/Header.tsx reads it), so not httpOnly.
  response.cookies.set("loggedIn", "true", {
    secure,
    sameSite: "strict",
    maxAge: ttlSeconds,
    path: "/",
  });

  return now + ttlSeconds * 1000;
}
