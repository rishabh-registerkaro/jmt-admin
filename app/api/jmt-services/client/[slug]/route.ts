import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/app/lib/config/db";
import { normalizeContent, validSlug } from "@/app/lib/server/jmtServicePages";

// Public: one published JMT service page for jmt-frontend (server/service.ts).
// Answers 200 with { page: null } when the slug has no published page, so the
// frontend can cache that answer too (tagged) and fall back to built-in
// content; drafts are never exposed.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const slug = validSlug((await params).slug);
  const headers = { "Cache-Control": "no-store" };
  if (!slug) return NextResponse.json({ page: null }, { headers });

  try {
    const row = await prisma.jmtServicePage.findFirst({
      where: { slug, status: "published" },
      select: { slug: true, title: true, content: true, updatedAt: true },
    });
    const page = row ? { ...row, content: normalizeContent(row.content, row.slug) } : null;
    return NextResponse.json({ page }, { headers });
  } catch (error) {
    console.error(`[jmt-services] reading "${slug}" failed:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
