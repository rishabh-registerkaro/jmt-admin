import { NextResponse, type NextRequest } from "next/server";
import { getHomepageData, getHomepageVersion, getSiteChrome } from "@/server/homepage";
import { isSwitcherLanguage, type HomepageData, type SiteChrome } from "@/types/homepage";

// Public read for the jmt-frontend project (the Joy Maa Tara homepage), which
// has no database access of its own. Returns the fully built view model.
//
// Every read behind this is cached under the tags the dashboard already
// expires on save (server/homepage.ts), so calling it does not hit MySQL until
// something changes; jmt-frontend caches the response under the same tags.
// Only published, public homepage content is returned.
//
// ?locale=bn|hi returns the page translated (Bengali / Hindi); anything else,
// or no locale, returns English. The version stamp is the same for all.
export const dynamic = "force-dynamic";

export interface HomepageClientResponse {
  data: HomepageData;
  chrome: SiteChrome;
  version: string;
}

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("locale");
  const lang = isSwitcherLanguage(requested) ? requested : "en";
  const [data, chrome, version] = await Promise.all([
    getHomepageData(lang),
    getSiteChrome(lang),
    getHomepageVersion(),
  ]);
  const body: HomepageClientResponse = { data, chrome, version };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
