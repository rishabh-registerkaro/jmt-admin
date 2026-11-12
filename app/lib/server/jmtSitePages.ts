// Shared helpers for the JMT site page API routes (app/api/site-pages).

import { NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { mergeContent } from "@/lib/sitePages/mergeContent";
import { SITE_PAGES, isSitePageKey, type SitePageKey } from "@/app/lib/content/site-pages";
import { jmtSitePageTags, revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

export { isSitePageKey };

/** Saved document merged over the bundled copy (unknown keys dropped, bad values reverted). */
export function normalizeSitePage(key: SitePageKey, raw: unknown) {
  const page = SITE_PAGES[key];
  return mergeContent(raw, page.defaults, "locked" in page ? page.locked : []);
}

/**
 * A server started before `prisma generate` has no `jmtSitePage` model.
 * Tell the admin to restart instead of failing with a vague TypeError.
 */
export function staleClientResponse(): NextResponse | null {
  const delegate = (prisma as Partial<typeof prisma>).jmtSitePage;
  if (delegate && typeof delegate.findFirst === "function") return null;
  return NextResponse.json(
    {
      success: false,
      message:
        "The server is running an out-of-date database client. Run `npx prisma db push`, restart the server and try again.",
    },
    { status: 503 },
  );
}

export function errorResponse(action: string, error: unknown) {
  console.error(`[site-pages] ${action} failed:`, error);
  const detail = error instanceof Error ? error.message.split("\n")[0] : "";
  const message =
    process.env.NODE_ENV === "development" && detail ? `${action} failed: ${detail}` : `Internal Server Error - ${action}`;
  return NextResponse.json({ success: false, message }, { status: 500 });
}

/** Expires the page on jmt-frontend (best effort, never throws). */
export const revalidateSitePage = (key: SitePageKey) => revalidateFrontendTags(jmtSitePageTags(key));
