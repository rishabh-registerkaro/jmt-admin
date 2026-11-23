import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requirePermission, hasPermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { GLOBAL_SCOPE } from "@/app/lib/content/seo";
import { errorResponse, seoPageList, serializeEntry, staleClientResponse } from "@/app/lib/server/jmtSeo";

// SEO & Scripts overview for the dashboard (app/dashboard/seo): the site-wide
// row, and every page with how many schemas / scripts it has.

const SEO_PERMISSIONS = [PERMISSIONS.SEO_MANAGE, PERMISSIONS.SEO_SCRIPTS];

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, SEO_PERMISSIONS);
  if (auth instanceof NextResponse) return auth;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const rows = await prisma.jmtSeo.findMany();
    const global = rows.find((row) => row.scope === GLOBAL_SCOPE) ?? null;
    return NextResponse.json({
      success: true,
      canSchemas: hasPermission(auth, PERMISSIONS.SEO_MANAGE),
      canScripts: hasPermission(auth, PERMISSIONS.SEO_SCRIPTS),
      global: serializeEntry(GLOBAL_SCOPE, global),
      pages: await seoPageList(rows),
    });
  } catch (error) {
    return errorResponse("Loading SEO settings", error);
  }
}
