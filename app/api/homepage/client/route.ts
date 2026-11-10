import { NextResponse } from "next/server";
import { getHomepageData, getHomepageVersion, getSiteChrome } from "@/server/homepage";
import type { HomepageData, SiteChrome } from "@/types/homepage";

// Public read for the jmt-frontend project (the Joy Maa Tara homepage), which
// has no database access of its own. Returns the fully built view model.
//
// Every read behind this is cached under the tags the dashboard already
// expires on save (server/homepage.ts), so calling it does not hit MySQL until
// something changes; jmt-frontend caches the response under the same tags.
// Only published, public homepage content is returned.
export const dynamic = "force-dynamic";

export interface HomepageClientResponse {
  data: HomepageData;
  chrome: SiteChrome;
  version: string;
}

export async function GET() {
  const [data, chrome, version] = await Promise.all([
    getHomepageData(),
    getSiteChrome(),
    getHomepageVersion(),
  ]);
  const body: HomepageClientResponse = { data, chrome, version };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
