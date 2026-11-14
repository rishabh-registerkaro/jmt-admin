import { revalidateTag } from "next/cache";
import { isDeployed, isLocalUrl, resolveFrontendUrl } from "@/lib/frontendUrl";

// Cache invalidation on the frontends.
// Called automatically after content mutations so creates, edits and deletes
// show on the live sites immediately — no manual "revalidate" needed.
//
// Two frontends read this CMS:
//   • PRODUCTION_URL   — the main website
//   • JMT_FRONTEND_URL — the Joy Maa Tara homepage (the jmt-frontend project)
// Both expose POST /api/revalidate guarded by the shared REVALIDATE_SECRET.
//
// Nothing here throws: a frontend that is down must not fail the admin's save.
// Its cache still expires on its own after HOMEPAGE_REVALIDATE_SECONDS. The
// per-site results are returned so the dashboard can say which site failed.

export {
  serviceTags,
  postTags,
  packageTags,
  jmtServiceTags,
  jmtSitePageTags,
} from "./cacheTags";

// Hosting dashboards often end up with surrounding quotes or stray whitespace
// pasted into env values (dotenv strips quotes, dashboard UIs don't). Normalize
// so both sides compare the same secret regardless.
export const normalizeSecret = (v: string | null | undefined) =>
  (v ?? "").trim().replace(/^['"]|['"]$/g, "");

const originOf = (v: string | null | undefined) => normalizeSecret(v).replace(/\/+$/, "");

/**
 * Origin of the main website, or "" when there is none to notify (unset, or a
 * localhost value on a deployed admin — that could never be reached).
 */
export const productionUrl = () => {
  const url = originOf(process.env.PRODUCTION_URL);
  if (!url) return isDeployed() ? "" : "http://localhost:3001";
  return isDeployed() && isLocalUrl(url) ? "" : url;
};

/** Origin of the jmt-frontend project (Joy Maa Tara homepage). Never localhost when deployed. */
export const jmtFrontendUrl = () => resolveFrontendUrl(process.env.JMT_FRONTEND_URL);

export type SiteName = "main" | "jmt";

export interface SiteResult {
  site: SiteName;
  ok: boolean;
  status?: number;
  /** Short reason when `ok` is false: "secret mismatch", "timed out", … */
  message?: string;
  timedOut?: boolean;
}

/** POSTs `tags` to one frontend's /api/revalidate. Never throws. */
async function notifySite(site: SiteName, origin: string, tags: string[]): Promise<SiteResult> {
  try {
    const res = await fetch(`${origin}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": normalizeSecret(process.env.REVALIDATE_SECRET),
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return { site, ok: true, status: res.status };

    const message =
      res.status === 401
        ? "secret mismatch"
        : res.status === 400
          ? "rejected the tags"
          : `HTTP ${res.status}`;
    console.log(`Revalidation on ${site} site (${origin}) failed: ${message}`);
    return { site, ok: false, status: res.status, message };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    const message = timedOut ? "timed out" : "unreachable";
    console.log(`Revalidation on ${site} site (${origin}) failed: ${message}`, timedOut ? "" : error);
    return { site, ok: false, message, timedOut };
  }
}

/**
 * Expires `tags` on both frontends in parallel. When both URLs point at the
 * same origin the site is notified once, reported as "main".
 */
export async function notifyFrontends(tags: string[]): Promise<SiteResult[]> {
  const main = productionUrl();
  const jmt = jmtFrontendUrl();
  if (!main) return [await notifySite("jmt", jmt, tags)];
  if (main === jmt) return [await notifySite("main", main, tags)];
  return Promise.all([notifySite("main", main, tags), notifySite("jmt", jmt, tags)]);
}

/** Expires `tags` on the jmt-frontend project only. Never throws. */
export async function revalidateJmtFrontend(tags: string[]): Promise<void> {
  const url = jmtFrontendUrl();
  // Same origin as PRODUCTION_URL → it is already being notified.
  if (url === productionUrl()) return;
  await notifySite("jmt", url, tags);
}

/**
 * Expires `tags` locally and on both frontends. Never throws; returns how each
 * frontend responded.
 */
export async function revalidateFrontendTags(tags: string[]): Promise<SiteResult[]> {
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

  return notifyFrontends(tags);
}

/** HTTP status for a revalidate response built from per-site results. */
export function statusForResults(sites: SiteResult[]): number {
  const failed = sites.filter((s) => !s.ok);
  if (failed.length === 0) return 200;
  return failed.every((s) => s.timedOut) ? 504 : 502;
}
