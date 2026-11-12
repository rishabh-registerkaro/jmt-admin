import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/app/lib/config/db";
import { isSitePageKey, normalizeSitePage } from "@/app/lib/server/jmtSitePages";

// Public: one JMT site page for jmt-frontend (server/sitePages.ts).
// Answers 200 with { page: null } when nothing is saved, so the frontend can
// cache that answer too (tagged) and show its bundled copy.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const headers = { "Cache-Control": "no-store" };
  if (!isSitePageKey(key)) return NextResponse.json({ page: null }, { headers });

  try {
    const row = await prisma.jmtSitePage.findUnique({ where: { key }, select: { content: true, updatedAt: true } });
    const page = row ? { content: normalizeSitePage(key, row.content), updatedAt: row.updatedAt } : null;
    return NextResponse.json({ page }, { headers });
  } catch (error) {
    console.error(`[site-pages] reading "${key}" failed:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
