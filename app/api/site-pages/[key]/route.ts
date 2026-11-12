import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES, EDITOR_ROLES } from "@/app/lib/constants/role";
import {
  errorResponse,
  isSitePageKey,
  normalizeSitePage,
  revalidateSitePage,
  staleClientResponse,
} from "@/app/lib/server/jmtSitePages";

// One JMT site page (About, Contact, Join our crew) — dashboard read / save /
// reset. The page always exists on the website: without a saved document it
// shows the bundled copy, which is also what GET returns then.

type Context = { params: Promise<{ key: string }> };

const unknownPage = () => NextResponse.json({ success: false, message: "Unknown page" }, { status: 404 });

export async function GET(req: NextRequest, { params }: Context) {
  const auth = await requireRole(req, CONTENT_ROLES);
  if (auth instanceof NextResponse) return auth;
  const { key } = await params;
  if (!isSitePageKey(key)) return unknownPage();
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const row = await prisma.jmtSitePage.findUnique({ where: { key } });
    return NextResponse.json({
      success: true,
      exists: Boolean(row),
      updatedAt: row?.updatedAt ?? null,
      content: normalizeSitePage(key, row?.content ?? null),
    });
  } catch (error) {
    return errorResponse(`Loading the "${key}" page`, error);
  }
}

// PUT — save. Body: { content }.
export async function PUT(req: NextRequest, { params }: Context) {
  const auth = await requireRole(req, CONTENT_ROLES);
  if (auth instanceof NextResponse) return auth;
  const { key } = await params;
  if (!isSitePageKey(key)) return unknownPage();
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.content !== "object" || body.content === null || Array.isArray(body.content)) {
      return NextResponse.json({ success: false, message: "content must be a JSON object" }, { status: 400 });
    }
    // Never trust the client shape: unknown keys dropped, bad values and unsafe image URLs reverted.
    const content = normalizeSitePage(key, body.content) as Prisma.InputJsonValue;
    const row = await prisma.jmtSitePage.upsert({
      where: { key },
      create: { key, content },
      update: { content },
    });
    await revalidateSitePage(key);
    return NextResponse.json({
      success: true,
      message: "Page saved",
      exists: true,
      updatedAt: row.updatedAt,
      content: normalizeSitePage(key, row.content),
    });
  } catch (error) {
    return errorResponse(`Saving the "${key}" page`, error);
  }
}

// DELETE — reset to the bundled copy.
export async function DELETE(req: NextRequest, { params }: Context) {
  const auth = await requireRole(req, EDITOR_ROLES);
  if (auth instanceof NextResponse) return auth;
  const { key } = await params;
  if (!isSitePageKey(key)) return unknownPage();
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    await prisma.jmtSitePage.deleteMany({ where: { key } });
    await revalidateSitePage(key);
    return NextResponse.json({
      success: true,
      message: "Page reset to the default copy",
      exists: false,
      updatedAt: null,
      content: normalizeSitePage(key, null),
    });
  } catch (error) {
    return errorResponse(`Resetting the "${key}" page`, error);
  }
}
