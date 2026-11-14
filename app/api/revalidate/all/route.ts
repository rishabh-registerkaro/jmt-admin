import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";
import { SITE_PAGE_KEYS } from "@/app/lib/content/site-pages";
import {
  MAX_TAGS_PER_REQUEST,
  STATIC_TAGS,
  jmtServiceTags,
  jmtSitePageTags,
  packageTags,
  postTags,
  serviceTags,
} from "@/app/lib/utils/cacheTags";
import {
  revalidateFrontendTags,
  statusForResults,
  type SiteResult,
} from "@/app/lib/utils/revalidateFrontend";

// "Reset all cache" in the dashboard sidebar. Admins only.
//
// The frontends have no single "everything" tag, so this lists every tag from
// the database (one per post, service page, package target, site page, plus
// the fixed ones) and expires them in chunks of MAX_TAGS_PER_REQUEST, the most
// each frontend accepts per request.

const TAG_PATTERN = /^[a-z0-9_-]{1,100}$/i;

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

async function allTags(): Promise<string[]> {
  const [posts, services, packages, jmtServices] = await Promise.all([
    prisma.post.findMany({ select: { slug: true } }),
    prisma.servicePage.findMany({ select: { slug: true } }),
    prisma.packageBlock.findMany({ select: { targetPages: true } }),
    prisma.jmtServicePage.findMany({ select: { slug: true } }),
  ]);

  const tags = new Set<string>([
    ...STATIC_TAGS,
    ...posts.flatMap((p) => postTags(p.slug)),
    ...services.flatMap((s) => serviceTags(s.slug)),
    ...packageTags(packages.flatMap((p) => asStringArray(p.targetPages))),
    ...jmtServiceTags(...jmtServices.map((s) => s.slug)),
    ...jmtSitePageTags(...SITE_PAGE_KEYS),
  ]);

  // A slug with characters the frontends reject would fail its whole chunk.
  return [...tags].filter((t) => TAG_PATTERN.test(t));
}

/** One result per site: ok only if every chunk succeeded there. */
function mergeResults(chunks: SiteResult[][]): SiteResult[] {
  const bySite = new Map<string, SiteResult>();
  for (const result of chunks.flat()) {
    const prev = bySite.get(result.site);
    if (!prev || (prev.ok && !result.ok)) bySite.set(result.site, result);
  }
  return [...bySite.values()];
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ADMIN_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const tags = await allTags();

    const chunks: SiteResult[][] = [];
    for (let i = 0; i < tags.length; i += MAX_TAGS_PER_REQUEST) {
      chunks.push(await revalidateFrontendTags(tags.slice(i, i + MAX_TAGS_PER_REQUEST)));
    }

    const sites = mergeResults(chunks);
    const status = statusForResults(sites);

    return NextResponse.json(
      {
        success: status === 200,
        tagCount: tags.length,
        sites,
        ...(status === 200 ? {} : { message: "Cache reset failed on one or more sites" }),
      },
      { status },
    );
  } catch (error) {
    console.error("POST /api/revalidate/all error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
