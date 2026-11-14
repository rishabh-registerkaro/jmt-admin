// Where the jmt-frontend website lives. Used by "View live" / "Preview" links
// (browser) and by cache revalidation (server).
//
// Order:
//   1. The configured env value, unless it points at localhost while the admin
//      itself is deployed (a common mistake: copying the local .env to Vercel).
//   2. Deployed admin → the deployed website. Local dev → http://localhost:3002.

/** Production URL of the jmt-frontend website. */
export const DEPLOYED_FRONTEND_URL = "https://jmt-frontend-eight.vercel.app";
const LOCAL_FRONTEND_URL = "http://localhost:3002";

/** Trims whitespace, surrounding quotes and trailing slashes from an env value. */
export const cleanOrigin = (v: string | null | undefined) =>
  (v ?? "").trim().replace(/^['"]|['"]$/g, "").trim().replace(/\/+$/, "");

export const isLocalUrl = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url);

/** True when this admin is running somewhere other than a developer's machine. */
export function isDeployed(): boolean {
  if (typeof window !== "undefined") return !isLocalUrl(window.location.origin);
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
}

/** Configured URL if usable here, otherwise the right default for this environment. */
export function resolveFrontendUrl(value: string | null | undefined): string {
  const url = cleanOrigin(value);
  const deployed = isDeployed();
  if (url && !(deployed && isLocalUrl(url))) return url;
  return deployed ? DEPLOYED_FRONTEND_URL : LOCAL_FRONTEND_URL;
}

/**
 * Public URL of the website, for links opened in the browser.
 * NEXT_PUBLIC_* must be referenced literally so Next inlines it at build time.
 */
export const FRONTEND_URL = resolveFrontendUrl(process.env.NEXT_PUBLIC_JMT_FRONTEND_URL);
