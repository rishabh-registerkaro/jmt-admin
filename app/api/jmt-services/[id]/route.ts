import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS, CONTENT_PERMISSIONS } from "@/app/lib/constants/permissions";
import {
  STATUSES,
  errorResponse,
  normalizeContent,
  revalidatePages,
  serialize,
  serializeAutosave,
  staleClientResponse,
  validSlug,
  validTitle,
} from "@/app/lib/server/jmtServicePages";

// One JMT service page — dashboard read / save / delete.

type Context = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ success: false, message: "Service page not found" }, { status: 404 });

export async function GET(req: NextRequest, { params }: Context) {
  const auth = await requirePermission(req, CONTENT_PERMISSIONS);
  if (auth instanceof NextResponse) return auth;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const { id } = await params;
    const [page, autosave] = await Promise.all([
      prisma.jmtServicePage.findUnique({ where: { id } }),
      prisma.jmtServiceAutosave.findUnique({ where: { pageId_userId: { pageId: id, userId: auth.id } } }),
    ]);
    if (!page) return notFound();
    return NextResponse.json({
      success: true,
      page: serialize(page),
      autosave: autosave ? serializeAutosave(autosave, page.slug) : null,
    });
  } catch (error) {
    return errorResponse("Loading the service page", error);
  }
}

// PUT — save. Body: any of { slug, title, status, content }.
export async function PUT(req: NextRequest, { params }: Context) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_MANAGE);
  if (auth instanceof NextResponse) return auth;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const { id } = await params;
    const existing = await prisma.jmtServicePage.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return notFound();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    const data: Prisma.JmtServicePageUpdateInput = {};
    let slug = existing.slug;

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const next = validSlug(body.slug);
      if (!next) {
        return NextResponse.json(
          { success: false, message: "Slug must be lower-case letters, numbers and hyphens" },
          { status: 400 },
        );
      }
      if (await prisma.jmtServicePage.findUnique({ where: { slug: next }, select: { id: true } })) {
        return NextResponse.json({ success: false, message: `A page with the slug "${next}" already exists` }, { status: 409 });
      }
      data.slug = slug = next;
    }
    if (body.title !== undefined) {
      const title = validTitle(body.title);
      if (!title) return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 });
      data.title = title;
    }
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, message: "status must be draft or published" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.content !== undefined) {
      if (!body.content || typeof body.content !== "object") {
        return NextResponse.json({ success: false, message: "content must be a JSON object" }, { status: 400 });
      }
      // Never trust the client shape: unknown keys dropped, unsafe URLs reverted, lists capped.
      data.content = normalizeContent(body.content, slug) as unknown as Prisma.InputJsonValue;
    }

    const page = await prisma.jmtServicePage.update({ where: { id }, data });
    // These edits are saved now, so the autosave of them is done with.
    if (body.content !== undefined) await prisma.jmtServiceAutosave.deleteMany({ where: { pageId: id, userId: auth.id } });

    // Old and (if renamed) new URL both change on the live site.
    await revalidatePages(existing.slug, page.slug);
    return NextResponse.json({ success: true, message: "Service page saved", page: serialize(page) });
  } catch (error) {
    return errorResponse("Saving the service page", error);
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const auth = await requirePermission(req, PERMISSIONS.SERVICES_MANAGE);
  if (auth instanceof NextResponse) return auth;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const { id } = await params;
    const existing = await prisma.jmtServicePage.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return notFound();
    await prisma.jmtServicePage.delete({ where: { id } });
    await revalidatePages(existing.slug);
    return NextResponse.json({ success: true, message: "Service page deleted" });
  } catch (error) {
    return errorResponse("Deleting the service page", error);
  }
}
