import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser } from "./getCurrentUser";
import type { Permission } from "@/app/lib/constants/permissions";

export type { CurrentUser };

/** True if the user has the permission (or, for a list, any of them). */
export function hasPermission(
  user: Pick<CurrentUser, "permissions"> | null | undefined,
  perm: Permission | readonly Permission[],
): boolean {
  if (!user) return false;
  const wanted = Array.isArray(perm) ? perm : [perm as Permission];
  return wanted.some((p) => user.permissions.includes(p));
}

/**
 * Require a signed-in user holding the permission.
 * Pass an array to accept ANY of them, or `{ all: true }` to require all.
 * Returns the user if allowed, otherwise a 401/403 NextResponse.
 */
export async function requirePermission(
  req: NextRequest,
  perm: Permission | readonly Permission[],
  opts: { all?: boolean } = {},
): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser(req);
  if (user instanceof NextResponse) return user;

  const wanted = Array.isArray(perm) ? perm : [perm as Permission];
  const ok = opts.all
    ? wanted.every((p) => user.permissions.includes(p))
    : wanted.some((p) => user.permissions.includes(p));

  if (!ok) {
    return NextResponse.json(
      { success: false, message: "Access denied. You don't have permission to access this resource." },
      { status: 403 },
    );
  }
  return user;
}

/** Require any signed-in user (no particular permission). */
export async function requireUser(req: NextRequest): Promise<CurrentUser | NextResponse> {
  return getCurrentUser(req);
}
