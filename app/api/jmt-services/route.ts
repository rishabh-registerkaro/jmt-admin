import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES, EDITOR_ROLES } from "@/app/lib/constants/role";
import {
  STATUSES,
  builtInPages,
  errorResponse,
  normalizeContent,
  revalidatePages,
  serialize,
  staleClientResponse,
  validSlug,
  validTitle,
} from "@/app/lib/server/jmtServicePages";

// JMT service pages (jmt-frontend /service/<slug>) — dashboard list + create.

// GET — every page (drafts included), newest edit first, plus built-in pages
// that have not been imported into the CMS yet.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, CONTENT_ROLES);
  if (auth instanceof NextResponse) return auth;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const rows = await prisma.jmtServicePage.findMany({
      select: { id: true, slug: true, title: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    const saved = new Set(rows.map((r) => r.slug));
    const builtIn = builtInPages()
      .filter((p) => !saved.has(p.slug))
      .map((p) => ({ slug: p.slug, title: p.hero.breadcrumb.current }));
    return NextResponse.json({ success: true, pages: rows, builtIn });
  } catch (error) {
    return errorResponse("Loading service pages", error);
  }
}

// POST — create a page. Body: { slug, title, status?, content?, copyFrom? }.
// `copyFrom` (a slug) starts the new page from that page's content; without
// it the page starts from the built-in design content.
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, EDITOR_ROLES);
  if (auth instanceof NextResponse) return auth;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const body = await req.json().catch(() => null);
    const slug = validSlug(body?.slug);
    const title = validTitle(body?.title);
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug must be lower-case letters, numbers and hyphens (e.g. supervision-and-compliance)" },
        { status: 400 },
      );
    }
    if (!title) return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 });
    const status = STATUSES.includes(body?.status) ? body.status : "draft";

    if (await prisma.jmtServicePage.findUnique({ where: { slug }, select: { id: true } })) {
      return NextResponse.json({ success: false, message: `A page with the slug "${slug}" already exists` }, { status: 409 });
    }

    let raw: unknown = body?.content;
    const copyFrom = validSlug(body?.copyFrom);
    if (raw === undefined && copyFrom) {
      const source = await prisma.jmtServicePage.findUnique({ where: { slug: copyFrom }, select: { content: true } });
      raw = source ? normalizeContent(source.content, copyFrom) : undefined;
    }

    const page = await prisma.jmtServicePage.create({
      data: {
        slug,
        title,
        status,
        content: normalizeContent(raw, slug) as unknown as Prisma.InputJsonValue,
        authorId: auth.id,
      },
    });

    if (page.status === "published") await revalidatePages(slug);
    return NextResponse.json({ success: true, message: "Service page created", page: serialize(page) }, { status: 201 });
  } catch (error) {
    return errorResponse("Creating the service page", error);
  }
}
