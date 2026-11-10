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

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import {
  HOMEPAGE_REVALIDATE_SECONDS,
  HOMEPAGE_TAGS,
  MAX_INSIGHTS,
  MEDIA_PREFIX,
  MEDIA_SLOTS,
  buildHomepageData,
  buildSiteChrome,
  type PostInput,
} from "@/lib/homepage/buildHomepage";
import type { HomepageData, SiteChrome } from "@/types/homepage";

export { HOMEPAGE_REVALIDATE_SECONDS, HOMEPAGE_TAGS, resolveHref } from "@/lib/homepage/buildHomepage";

// ── Prisma selects (typed payloads derived from @prisma/client) ──────────────

const menuSelect = {
  mainMenu: true,
  contactDetails: true,
} satisfies Prisma.HeaderMenuSelect & Prisma.FooterMenuSelect;

const postSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
  publishedAt: true,
  createdAt: true,
  categories: { select: { name: true }, take: 1 },
} satisfies Prisma.PostSelect;

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

// unstable_cache JSON-serialises results, so Dates come back as strings —
// convert them inside the cached function and return plain strings.
const readPosts = unstable_cache(
  async (): Promise<PostInput[]> => {
    const rows = await prisma.post.findMany({
      where: { status: "published" },
      select: postSelect,
      // MySQL sorts NULL lowest, so undated posts fall to the end on DESC.
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: MAX_INSIGHTS,
    });
    return rows.map((row) => ({
      ...row,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    }));
  },
  ["homepage", "posts"],
  cacheOptions(HOMEPAGE_TAGS.posts),
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

/**
 * When the homepage document last changed (ISO string), for open browser tabs
 * to detect a new save. Cached under the same tag, so it costs no DB query
 * until the admin saves.
 */
const readHomePageVersion = unstable_cache(
  async (): Promise<string | null> => {
    const row = await prisma.homePage.findFirst({ select: { updatedAt: true }, orderBy: { updatedAt: "desc" } });
    return row ? row.updatedAt.toISOString() : null;
  },
  ["homepage", "version"],
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

/** Navbar, footer and contact details. Deduplicated per request via React `cache`. */
export const getSiteChrome = cache(async (): Promise<SiteChrome> => {
  const [header, footer, row] = await Promise.all([
    withFallback("header menu", readHeaderMenu, null),
    withFallback("footer menu", readFooterMenu, null),
    getHomePageRow(),
  ]);
  return buildSiteChrome(header, footer, row);
});

/** Version stamp of the saved homepage ("" when none). Used by LiveRefresh. */
export async function getHomepageVersion(): Promise<string> {
  return (await withFallback("homepage version", readHomePageVersion, null)) ?? "";
}

/** All section content for the homepage, resolved in parallel. */
export const getHomepageData = cache(async (): Promise<HomepageData> => {
  const [row, posts, media] = await Promise.all([
    getHomePageRow(),
    withFallback("blog posts", readPosts, []),
    withFallback("media overrides", readMediaOverrides, []),
  ]);
  return buildHomepageData(row, posts, media);
});
