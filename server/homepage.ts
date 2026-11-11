// Server-side data layer for the public Joy Maa Tara homepage.
//
// The homepage itself is rendered by the separate jmt-frontend project, which
// has no database access: it fetches the result of these reads from
// GET /api/homepage/client (app/api/homepage/client/route.ts).
//
// Every CMS read is:
//   • typed      — Prisma `select` payloads feed lib/homepage/buildHomepage.ts
//   • parallel   — independent queries run together via Promise.all
//   • cached     — `unstable_cache`, tagged with the same tags the admin API
//                  already emits on mutation (see app/lib/utils/revalidateFrontend.ts),
//                  so dashboard edits refresh the homepage immediately
//   • resilient  — any failure (no DATABASE_URL, unmigrated schema, MySQL down)
//                  falls back to the Figma content (defaultHomeContent()).
//                  Failures are thrown *inside* the cached function, so a
//                  fallback is never written to the cache.
//
// Page content comes from the `home_pages` singleton edited at
// /dashboard/homepage (app/lib/content/home-content.ts → HomePageContent).

import { createHash } from "node:crypto";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import {
  HOMEPAGE_REVALIDATE_SECONDS,
  HOMEPAGE_TAGS,
  MEDIA_PREFIX,
  MEDIA_SLOTS,
  buildHomepageData,
  buildSiteChrome,
} from "@/lib/homepage/buildHomepage";
import type { HomepageData, SiteChrome, SwitcherLanguage } from "@/types/homepage";

export { HOMEPAGE_REVALIDATE_SECONDS, HOMEPAGE_TAGS, resolveHref } from "@/lib/homepage/buildHomepage";

// ── Prisma selects (typed payloads derived from @prisma/client) ──────────────

const menuSelect = {
  mainMenu: true,
  contactDetails: true,
} satisfies Prisma.HeaderMenuSelect & Prisma.FooterMenuSelect;

const mediaSelect = {
  filename: true,
  url: true,
} satisfies Prisma.MediaAssetSelect;

const homePageSelect = {
  metaTitle: true,
  metaDescription: true,
  content: true,
} satisfies Prisma.HomePageSelect;

type MenuRow = Prisma.HeaderMenuGetPayload<{ select: typeof menuSelect }>;
type MediaRow = Prisma.MediaAssetGetPayload<{ select: typeof mediaSelect }>;
type HomePageRow = Prisma.HomePageGetPayload<{ select: typeof homePageSelect }>;

// ── Cached raw reads ─────────────────────────────────────────────────────────

const cacheOptions = (tag: string) => ({
  tags: [tag],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

const readHeaderMenu = unstable_cache(
  (): Promise<MenuRow | null> =>
    prisma.headerMenu.findFirst({ select: menuSelect, orderBy: { updatedAt: "desc" } }),
  ["homepage", "header-menu"],
  cacheOptions(HOMEPAGE_TAGS.headerMenu),
);

const readFooterMenu = unstable_cache(
  (): Promise<MenuRow | null> =>
    prisma.footerMenu.findFirst({ select: menuSelect, orderBy: { updatedAt: "desc" } }),
  ["homepage", "footer-menu"],
  cacheOptions(HOMEPAGE_TAGS.footerMenu),
);

const readMediaOverrides = unstable_cache(
  (): Promise<MediaRow[]> =>
    prisma.mediaAsset.findMany({
      where: {
        resourceType: "image",
        OR: MEDIA_SLOTS.map((slot) => ({ filename: { startsWith: `${MEDIA_PREFIX}${slot}` } })),
      },
      select: mediaSelect,
      orderBy: { createdAt: "desc" },
    }),
  ["homepage", "media"],
  cacheOptions(HOMEPAGE_TAGS.media),
);

const readHomePage = unstable_cache(
  (): Promise<HomePageRow | null> =>
    prisma.homePage.findFirst({ select: homePageSelect, orderBy: { updatedAt: "desc" } }),
  ["homepage", "content"],
  cacheOptions(HOMEPAGE_TAGS.homePage),
);

/** Runs a query; on any error logs once and returns the fallback instead. */
async function withFallback<T>(label: string, query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.error(`[homepage] ${label} unavailable, using fallback content: ${reason}`);
    return fallback;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** The saved homepage document, or null when none exists or MySQL is down. Per request. */
const getHomePageRow = cache(() => withFallback("homepage content", readHomePage, null));

/** Navbar, footer and contact details in `lang`. Deduplicated per request via React `cache`. */
export const getSiteChrome = cache(async (lang: SwitcherLanguage = "en"): Promise<SiteChrome> => {
  const [header, footer, row] = await Promise.all([
    withFallback("header menu", readHeaderMenu, null),
    withFallback("footer menu", readFooterMenu, null),
    getHomePageRow(),
  ]);
  return buildSiteChrome(header, footer, row, lang);
});

/** All section content for the homepage in `lang`, resolved in parallel. */
export const getHomepageData = cache(async (lang: SwitcherLanguage = "en"): Promise<HomepageData> => {
  const [row, media] = await Promise.all([
    getHomePageRow(),
    withFallback("media overrides", readMediaOverrides, []),
  ]);
  return buildHomepageData(row, media, lang);
});

/**
 * Fingerprint of everything the homepage shows (sections, navbar, footer,
 * contact details, photos). Open homepage tabs poll it (LiveRefresh) and
 * reload when it changes — so a Header/Footer Menu or Media edit refreshes
 * them too, not only a Homepage save. Covers every language (a Bengali-only
 * edit changes it too). Built from the cached reads above, so it costs no
 * database query until one of their tags is expired.
 */
export async function getHomepageVersion(): Promise<string> {
  const [data, chrome, row] = await Promise.all([getHomepageData(), getSiteChrome(), getHomePageRow()]);
  const content = row?.content;
  const translations =
    typeof content === "object" && content !== null && !Array.isArray(content)
      ? (content as Record<string, unknown>).translations ?? null
      : null;
  return createHash("sha1").update(JSON.stringify({ data, chrome, translations })).digest("hex").slice(0, 16);
}
