import { NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { GLOBAL_SCOPE } from "@/app/lib/content/seo";
import { isMissingTable, readGtmId, readSchemas, readScripts } from "@/app/lib/server/jmtSeo";

// Public: the whole SEO & Scripts config for jmt-frontend (server/seo.ts),
// fetched once and cached there under the "jmt-seo" tag.
//
//   { gtmId, global: { schemas, scripts }, pages: { "/about": { schemas, scripts }, … } }
//
// Only enabled scripts, and only their parsed `nodes` — never the raw pasted code.
// Everything here ends up in public HTML anyway.
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const EMPTY = { gtmId: null, global: { schemas: [], scripts: [] }, pages: {} };

function publicEntry(scope: string, row: { schemas: unknown; scripts: unknown }) {
  return {
    schemas: readSchemas(row.schemas),
    scripts: readScripts(row.scripts, scope)
      .filter((s) => s.enabled)
      .map(({ id, timing, nodes }) => ({ id, timing, nodes })),
  };
}

export async function GET() {
  try {
    const delegate = (prisma as Partial<typeof prisma>).jmtSeo;
    // Out-of-date client (before `prisma generate`): answer empty, the site still works.
    if (!delegate) return NextResponse.json(EMPTY, { headers });

    const rows = await prisma.jmtSeo.findMany({ select: { scope: true, gtmId: true, schemas: true, scripts: true } });
    const global = rows.find((row) => row.scope === GLOBAL_SCOPE);
    const pages: Record<string, ReturnType<typeof publicEntry>> = {};
    for (const row of rows) {
      if (row.scope === GLOBAL_SCOPE) continue;
      const entry = publicEntry(row.scope, row);
      if (entry.schemas.length || entry.scripts.length) pages[row.scope] = entry;
    }
    return NextResponse.json(
      {
        gtmId: readGtmId(global?.gtmId),
        global: global ? publicEntry(GLOBAL_SCOPE, global) : { schemas: [], scripts: [] },
        pages,
      },
      { headers },
    );
  } catch (error) {
    // Table not created yet: nothing is configured, so answer empty instead of failing.
    if (isMissingTable(error)) return NextResponse.json(EMPTY, { headers });
    console.error("[seo] reading the public config failed:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
