import { revalidateTag } from "next/cache";

// Fire-and-forget cache invalidation on the frontends.
// Called automatically after content mutations so creates, edits and deletes
// show on the live sites immediately — no manual "revalidate" needed.
//
// Two frontends read this CMS:
//   • PRODUCTION_URL   — the Global Elite website
//   • JMT_FRONTEND_URL — the Joy Maa Tara homepage (the jmt-frontend project)
// Both expose POST /api/revalidate guarded by the shared REVALIDATE_SECRET.

// Hosting dashboards often end up with surrounding quotes or stray whitespace
// pasted into env values (dotenv strips quotes, dashboard UIs don't). Normalize
// so both sides compare the same secret regardless.
export const normalizeSecret = (v: string | null | undefined) =>
  (v ?? "").trim().replace(/^['"]|['"]$/g, "");

const originOf = (v: string | null | undefined) => normalizeSecret(v).replace(/\/+$/, "");

/** Origin of the jmt-frontend project (Joy Maa Tara homepage). */
export const jmtFrontendUrl = () => originOf(process.env.JMT_FRONTEND_URL) || "http://localhost:3002";

/**
 * Expires `tags` on the jmt-frontend project. Never throws — a frontend that
 * is down must not fail the admin's save; its cache still expires on its own
 * after HOMEPAGE_REVALIDATE_SECONDS.
 */
export async function revalidateJmtFrontend(tags: string[]): Promise<void> {
  const url = jmtFrontendUrl();
  // Same origin as PRODUCTION_URL → it is already being notified.
  if (url === originOf(process.env.PRODUCTION_URL || "http://localhost:3001")) return;
  try {
    const res = await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": normalizeSecret(process.env.REVALIDATE_SECRET),
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) console.log(`JMT frontend revalidation failed: HTTP ${res.status}`);
  } catch (error) {
    console.log("JMT frontend revalidation failed:", error);
  }
}

export async function revalidateFrontendTags(tags: string[]): Promise<void> {
  // GET /api/homepage/client serves the homepage from cached CMS reads that
  // use these same tags (server/homepage.ts) — expire them locally first, so
  // the frontend's re-fetch below gets fresh data.
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (error) {
      console.log(`Local revalidation of "${tag}" failed:`, error);
    }
  }

  const notifyProductionSite = async () => {
    const FRONTEND_URL = process.env.PRODUCTION_URL || "http://localhost:3001";
    try {
      await fetch(`${FRONTEND_URL}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": normalizeSecret(process.env.REVALIDATE_SECRET),
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      // Never fail the mutation because the frontend cache couldn't be cleared —
      // the admin can still use the manual revalidate button.
      console.log("Frontend revalidation failed:", error);
    }
  };

  await Promise.all([notifyProductionSite(), revalidateJmtFrontend(tags)]);
}

export const serviceTags = (slug: string) => ["service-list", `service-${slug}`];

/**
 * A package block is injected into other pages, so clearing it must clear every
 * page it targets — plus `package-list` for anything listing blocks. On rename
 * or retarget, pass the union of the old and new target pages.
 */
export const packageTags = (targetPages: string[]) => [
  "package-list",
  ...targetPages.filter(Boolean).map((p) => `packages-${p}`),
];

/**
 * Cache tags of a Joy Maa Tara service page (jmt-frontend server/service.ts →
 * SERVICE_TAGS). The list tag also covers the slug list used at build time.
 */
export const jmtServiceTags = (...slugs: string[]) => [
  "jmt-service-list",
  ...slugs.filter(Boolean).map((slug) => `jmt-service-${slug}`),
];

/**
 * Cache tag of a Joy Maa Tara site page (About, Contact, Join our crew) —
 * jmt-frontend lib/sitePages/registry.ts → sitePageTag.
 */
export const jmtSitePageTags = (...keys: string[]) => keys.filter(Boolean).map((key) => `jmt-page-${key}`);
