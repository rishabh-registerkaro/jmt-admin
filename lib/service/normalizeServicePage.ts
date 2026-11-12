// Turns a stored (untrusted) service-page JSON document into a complete,
// safe ServicePageContent. Shared by both projects — keep the copies in
// jmt-admin/lib/service/ and jmt-frontend/lib/service/ identical.
//
// The built-in page (data/services/siteLabourSupply.ts) is the schema: every
// key is read from the stored document when it has the right type, otherwise
// the built-in value is used. So a field added to the design later simply
// shows its default until an admin edits it — no migration needed.
//
//   • strings  — trimmed, capped (empty is allowed: admins may blank a field)
//   • arrays   — capped; items beyond the built-in list use a blank template
//   • images   — src must be an https URL or a /public path
//   • icons    — must be one of the icons the component draws
//   • links    — "#anchor", "/path", https, tel: or mailto: only
//   • ids      — slugified, derived from the name when empty, de-duplicated

import { SITE_LABOUR_SUPPLY } from "@/data/services/siteLabourSupply";
import type { ServicePageContent } from "@/types/service";

const MAX_TEXT = 2000;
const MAX_ITEMS = 30;

/** Allowed values per path ("*" = any array index). */
const ENUMS: Record<string, readonly string[]> = {
  "hero.facts.*.icon": ["users", "clock", "moon", "refresh"],
  "included.chips.*.icon": ["check", "shield"],
  "crew.checks.*.icon": ["hammer", "id", "info", "hat", "user"],
};
const IMAGE_FOCUS = ["center", "top", "upper", "left", "right"] as const;

/** Paths whose value is a link. */
const HREF_PATHS = new Set(["related.services.*.href"]);

/** id fields → the sibling field they are derived from when empty. */
const ID_SOURCES: Record<string, string> = {
  "roles.trades.*.id": "name",
  "roles.trades.*.roles.*.id": "name",
  "faq.items.*.id": "question",
};

export const SERVICE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isSafeImageSrc(src: string): boolean {
  return /^https?:\/\/[^\s"'<>]+$/i.test(src) || /^\/(?!\/)[^\s"'<>]*$/.test(src);
}

export function isSafeHref(href: string): boolean {
  return (
    href.startsWith("#") ||
    /^\/(?!\/)/.test(href) ||
    /^https?:\/\/[^\s"'<>]+$/i.test(href) ||
    /^(mailto|tel):[^\s"'<>]+$/i.test(href)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const join = (path: string, key: string) => (path ? `${path}.${key}` : key);

const isImage = (value: Record<string, unknown>) => "src" in value && "width" in value && "height" in value;

/** Same shape as `template` with every text emptied (images and enums kept). */
function blank(template: unknown, path: string): unknown {
  if (typeof template === "string") return ENUMS[path] ? template : "";
  if (Array.isArray(template)) return [];
  if (isRecord(template)) {
    if (isImage(template)) return template;
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, blank(v, join(path, k))]));
  }
  return template;
}

function image(raw: unknown, fallback: Record<string, unknown>): Record<string, unknown> {
  const v = isRecord(raw) ? raw : {};
  const src = typeof v.src === "string" ? v.src.trim() : "";
  const dim = (value: unknown, def: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : def;
  const focus = typeof v.focus === "string" && (IMAGE_FOCUS as readonly string[]).includes(v.focus) ? v.focus : fallback.focus;
  const out: Record<string, unknown> = {
    // An empty or unsafe src keeps the built-in photo, so a page never renders a broken image.
    src: src && isSafeImageSrc(src) ? src : fallback.src,
    alt: typeof v.alt === "string" ? v.alt.trim().slice(0, MAX_TEXT) : fallback.alt,
    width: dim(v.width, fallback.width),
    height: dim(v.height, fallback.height),
  };
  if (focus) out.focus = focus;
  return out;
}

function walk(raw: unknown, fallback: unknown, path: string): unknown {
  if (typeof fallback === "string") {
    if (typeof raw !== "string") return fallback;
    const value = raw.trim().slice(0, MAX_TEXT);
    const allowed = ENUMS[path];
    if (allowed) return allowed.includes(value) ? value : fallback;
    if (HREF_PATHS.has(path)) return value === "" || isSafeHref(value) ? value : fallback;
    return value;
  }
  if (typeof fallback === "boolean") return typeof raw === "boolean" ? raw : fallback;
  if (typeof fallback === "number") return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;

  if (Array.isArray(fallback)) {
    if (!Array.isArray(raw)) return fallback;
    const itemPath = `${path}.*`;
    const template = fallback[0] ?? "";
    const items = raw.slice(0, MAX_ITEMS).map((item, i) => walk(item, fallback[i] ?? blank(template, itemPath), itemPath));
    return dedupeIds(items, itemPath);
  }

  if (isRecord(fallback)) {
    if (isImage(fallback)) return image(raw, fallback);
    const v = isRecord(raw) ? raw : {};
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(fallback)) out[key] = walk(v[key], fallback[key], join(path, key));
    // Optional strings the built-in item lacks (e.g. a plan's "highlight").
    for (const key of OPTIONAL_KEYS[path] ?? []) {
      if (!(key in out) && typeof v[key] === "string") out[key] = (v[key] as string).trim().slice(0, MAX_TEXT);
    }
    return out;
  }
  return fallback;
}

/** Optional string keys allowed on objects at a path even when the fallback lacks them. */
const OPTIONAL_KEYS: Record<string, string[]> = {
  "plans.plans.*": ["highlight"],
};

/** Fills empty ids from their source field and makes them unique within the list. */
function dedupeIds(items: unknown[], itemPath: string): unknown[] {
  const source = ID_SOURCES[`${itemPath}.id`];
  if (!source) return items;
  const seen = new Set<string>();
  return items.map((item, i) => {
    if (!isRecord(item)) return item;
    let id = slugify(String(item.id ?? "")) || slugify(String(item[source] ?? "")) || `item-${i + 1}`;
    const base = id;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return { ...item, id };
  });
}

/**
 * Complete, safe page content. `fallback` defaults to the built-in page; pass
 * a page's own built-in content when it has one.
 */
export function normalizeServicePage(
  raw: unknown,
  slug: string,
  fallback: ServicePageContent = SITE_LABOUR_SUPPLY,
): ServicePageContent {
  const page = walk(raw, fallback, "") as ServicePageContent;
  // Pre-ticked roles must exist on the page.
  const roleIds = new Set(page.roles.trades.flatMap((t) => t.roles.map((r) => r.id)));
  return {
    ...page,
    slug,
    roles: { ...page.roles, preselected: page.roles.preselected.filter((id) => roleIds.has(id)) },
  };
}
