// Cache tag builders shared by the admin API (server) and the dashboard's
// revalidate buttons (client). Keep this file free of server-only imports
// such as next/cache so client components can import it.
//
// Each tag must match the tags the frontends attach to their fetches:
//   • main website      — service-*, post-*, package*, about/contact/terms, menus
//   • jmt-frontend      — homepage*, jmt-service-*, jmt-page-*, menus

/** Tags that don't depend on any record. */
export const STATIC_TAGS = [
  "homepage",
  "homepage-media",
  "header-menu",
  "footer-menu",
  "post-list",
  "service-list",
  "package-list",
  "jmt-service-list",
  "about-page",
  "contact-page",
  "terms-policy",
] as const;

/** Most tags one revalidate request may carry (both frontends enforce it). */
export const MAX_TAGS_PER_REQUEST = 50;

export const serviceTags = (slug: string) => ["service-list", `service-${slug}`];

export const postTags = (slug: string) => ["post-list", `post-${slug}`];

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
