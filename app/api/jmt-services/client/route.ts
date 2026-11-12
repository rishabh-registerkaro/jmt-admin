import { NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";

// Public: slugs of the published JMT service pages. jmt-frontend prerenders
// these at build time (generateStaticParams) and caches the response under
// the "jmt-service-list" tag, which every save expires. `pages` adds each
// page's last change for the frontend sitemap's <lastmod>; `slugs` is kept
// for older frontend builds.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.jmtServicePage.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(
      {
        slugs: rows.map((r) => r.slug),
        pages: rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[jmt-services] listing published pages failed:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
