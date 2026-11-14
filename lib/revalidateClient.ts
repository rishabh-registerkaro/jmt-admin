"use client";

import { toast } from "sonner";

// Dashboard side of cache revalidation: calls the admin API (which holds the
// shared secret) and reports how each website responded.
//   POST /api/revalidate      — the tags of one screen (any CMS user)
//   POST /api/revalidate/all  — every tag on both sites (admins only)

interface SiteResult {
  site: "main" | "jmt";
  ok: boolean;
  message?: string;
}

interface RevalidateResponse {
  success?: boolean;
  message?: string;
  sites?: SiteResult[];
  tagCount?: number;
}

const SITE_LABEL: Record<SiteResult["site"], string> = {
  main: "Main site",
  jmt: "JMT site",
};

function describeSites(sites: SiteResult[]): string {
  return sites
    .map((s) => `${SITE_LABEL[s.site] ?? s.site} ${s.ok ? "✓" : `✗ ${s.message ?? "failed"}`}`)
    .join(" · ");
}

async function callRevalidate(
  url: string,
  body: unknown,
  { loading, success }: { loading: string; success: (data: RevalidateResponse) => string },
): Promise<boolean> {
  const toastId = toast.loading(loading);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    const data: RevalidateResponse = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      toast.success(success(data), { id: toastId });
      return true;
    }

    const sites = data.sites ?? [];
    if (sites.length > 0) {
      const someOk = sites.some((s) => s.ok);
      toast.error(someOk ? "Cache only partly cleared" : "Cache not cleared", {
        id: toastId,
        description: describeSites(sites),
      });
    } else {
      toast.error(data.message || "Revalidation failed", { id: toastId });
    }
    return false;
  } catch {
    toast.error("Revalidation failed", { id: toastId, description: "Couldn't reach the CMS server." });
    return false;
  }
}

const sitesSummary = (data: RevalidateResponse) =>
  data.sites && data.sites.length > 1 ? "on the main site and the JMT site" : "on the website";

/** Clears the given cache tags on both websites and shows a toast. */
export function revalidateTags(tags: string[], label?: string): Promise<boolean> {
  return callRevalidate(
    "/api/revalidate",
    { tags },
    {
      loading: label ? `Clearing cache for ${label}…` : "Revalidating cache…",
      success: (data) => `Cache cleared ${sitesSummary(data)} — the next visit fetches fresh content`,
    },
  );
}

/** Clears every cached page on both websites (admins only). */
export function resetAllCache(): Promise<boolean> {
  return callRevalidate(
    "/api/revalidate/all",
    {},
    {
      loading: "Resetting all cache…",
      success: (data) =>
        `All cache reset ${sitesSummary(data)}${data.tagCount ? ` (${data.tagCount} tags)` : ""}`,
    },
  );
}
