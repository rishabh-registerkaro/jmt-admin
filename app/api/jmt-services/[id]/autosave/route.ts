import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { errorResponse, normalizeContent } from "@/app/lib/server/jmtServicePages";

// The signed-in user's unfinished edits to one service page. Stored apart from
// the page, so nothing here reaches the website until the editor saves it.

type Context = { params: Promise<{ id: string }> };

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

// PUT — store the latest edits. Body: { title, slug, content, baseUpdatedAt }.
// Title and slug may be unfinished: the real save validates them.
export async function PUT(req: NextRequest, { params }: Context) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_MANAGE);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: pageId } = await params;
    const page = await prisma.jmtServicePage.findUnique({ where: { id: pageId }, select: { slug: true, updatedAt: true } });
    if (!page) return NextResponse.json({ success: false, message: "Service page not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body.content !== "object" || body.content === null) {
      return NextResponse.json({ success: false, message: "content must be a JSON object" }, { status: 400 });
    }

    const base = new Date(body.baseUpdatedAt);
    const data = {
      title: text(body.title, 200),
      slug: text(body.slug, 80),
      content: normalizeContent(body.content, page.slug) as unknown as Prisma.InputJsonValue,
    };
    const row = await prisma.jmtServiceAutosave.upsert({
      where: { pageId_userId: { pageId, userId: auth.id } },
      create: { ...data, pageId, userId: auth.id, baseUpdatedAt: Number.isNaN(base.getTime()) ? page.updatedAt : base },
      update: data,
    });
    return NextResponse.json({ success: true, savedAt: row.updatedAt });
  } catch (error) {
    return errorResponse("Autosaving the service page", error);
  }
}

// DELETE — discard the signed-in user's autosave for this page.
export async function DELETE(req: NextRequest, { params }: Context) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_MANAGE);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: pageId } = await params;
    await prisma.jmtServiceAutosave.deleteMany({ where: { pageId, userId: auth.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse("Discarding the autosave", error);
  }
}
