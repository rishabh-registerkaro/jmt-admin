import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";
import { SESSION_MAX_AGE_MS, SESSION_TOKEN_TTL_MS } from "@/app/lib/constants/session";

export interface SessionUser {
  id: string;
  username: string;
  role: string;
  /** The stored bcrypt hash — only its fingerprint goes into the token (see passwordVersion). */
  password: string;
}

/**
 * Short fingerprint of the stored password hash, carried in the token as `pwv`.
 * Any password change produces a new hash, so getCurrentUser and the refresh
 * route reject every session issued before it — no schema change needed.
 */
export function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

/** True when the token's `pwv` matches the user's current password hash. */
export function tokenMatchesPassword(decoded: { pwv?: unknown }, passwordHash: string): boolean {
  return typeof decoded.pwv === "string" && decoded.pwv === passwordVersion(passwordHash);
}

/** Session start (ms epoch) of a verified token; tokens without one fall back to `iat`. */
export function tokenSessionStart(decoded: { sessionStart?: unknown; iat?: number }): number {
  return typeof decoded.sessionStart === "number" ? decoded.sessionStart : (decoded.iat ?? 0) * 1000;
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
    { id: user.id, username: user.username, role: user.role, sessionStart, pwv: passwordVersion(user.password) },
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
