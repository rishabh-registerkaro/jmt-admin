// SEO & Scripts for the Joy Maa Tara site: shapes, limits and validation.
// Client-safe (no server imports): the API (app/api/seo) validates with it on
// every save, and the dashboard (app/dashboard/seo) uses it to show errors
// before saving. jmt-frontend server/seo.ts re-checks what it receives.
//
// What the website does with it:
//   • gtmId            → Google Tag Manager on every page
//   • schemas          → <script type="application/ld+json">, rendered on the server
//   • scripts[].nodes  → the pasted snippet, rebuilt from an allow-list of
//                        tags and attributes (script, noscript, meta, link)

// ── Shapes ───────────────────────────────────────────────────────────────────

export type ScriptTiming = "early" | "default" | "lazy";
export const SCRIPT_TIMINGS: readonly ScriptTiming[] = ["early", "default", "lazy"];

export const TIMING_LABELS: Record<ScriptTiming, string> = {
  early: "Early — before the page is interactive (site-wide only)",
  default: "Default — after the page is interactive",
  lazy: "Lazy — when the browser is idle",
};

/** One element of a parsed snippet. Attribute values are decoded text; "" = boolean attribute. */
export type SeoNode =
  | { tag: "script"; attrs: Record<string, string>; inner?: string }
  | { tag: "noscript"; inner: string }
  | { tag: "meta"; attrs: Record<string, string> }
  | { tag: "link"; attrs: Record<string, string> }
  | { tag: "jsonld"; data: JsonObject | JsonObject[] };

export interface SeoScript {
  id: string;
  name: string;
  enabled: boolean;
  timing: ScriptTiming;
  /** What the admin pasted, kept for editing. Never rendered as-is. */
  code: string;
  /** Parsed, allow-listed form of `code`: the only part the website renders. */
  nodes: SeoNode[];
}

export type JsonObject = { [key: string]: unknown };

/** Scope of a row: "global" (every page) or a public path ("/", "/about", "/service/<slug>"). */
export const GLOBAL_SCOPE = "global";

// ── Limits ───────────────────────────────────────────────────────────────────

export const MAX_SCHEMAS = 20;
export const MAX_SCHEMA_BYTES = 50_000;
export const MAX_SCRIPTS = 20;
export const MAX_SNIPPET_BYTES = 20_000;
export const MAX_SCRIPT_NAME = 80;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

// ── Scope & GTM ──────────────────────────────────────────────────────────────

const PATH_PATTERN = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

/** "global", or a clean lower-case path without trailing slash. null when invalid. */
export function normalizeScope(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (value === GLOBAL_SCOPE) return GLOBAL_SCOPE;
  const path = (value.startsWith("/") ? value : `/${value}`).replace(/\/+$/, "") || "/";
  return path.length <= 191 && PATH_PATTERN.test(path) ? path : null;
}

/** Container IDs look like "GTM-ABC1234". Strict, because the ID is written into an inline script. */
export const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/;

/** "" clears the ID. Returns the cleaned ID, or an error message. */
export function validateGtmId(raw: unknown): { value: string | null } | { error: string } {
  if (raw === null || raw === undefined) return { value: null };
  if (typeof raw !== "string") return { error: "The GTM container ID must be text" };
  const value = raw.trim().toUpperCase();
  if (!value) return { value: null };
  if (!GTM_ID_PATTERN.test(value)) {
    return { error: `"${raw.trim()}" isn't a GTM container ID. It looks like GTM-ABC1234 (Admin → Container settings in GTM).` };
  }
  return { value };
}

// ── JSON-LD ──────────────────────────────────────────────────────────────────

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** One schema object: needs @type or @graph; gets @context when missing. */
function checkSchemaObject(value: unknown, where: string): JsonObject | string {
  if (!isObject(value)) return `${where} must be a JSON object ({ ... })`;
  if (!("@type" in value) && !("@graph" in value)) return `${where} needs an "@type" (e.g. "LocalBusiness") or an "@graph"`;
  return "@context" in value ? value : { "@context": "https://schema.org", ...value };
}

/**
 * Parses one JSON-LD block typed in the dashboard (or a value already saved).
 * An array is split into its objects.
 */
export function parseSchemaBlock(input: unknown): { value: JsonObject[] } | { error: string } {
  let data = input;
  if (typeof input === "string") {
    const text = input.trim();
    if (!text) return { value: [] };
    if (byteLength(text) > MAX_SCHEMA_BYTES) return { error: `Too long (over ${MAX_SCHEMA_BYTES / 1000} KB)` };
    // Pasted with its <script type="application/ld+json"> wrapper: keep the JSON.
    const unwrapped = text.replace(/^<script[^>]*>\s*/i, "").replace(/\s*<\/script>\s*$/i, "");
    try {
      data = JSON.parse(unwrapped);
    } catch (error) {
      return { error: `Invalid JSON: ${error instanceof Error ? error.message : "check the syntax"}` };
    }
  }
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return { value: [] };
  const value: JsonObject[] = [];
  for (const [i, item] of items.entries()) {
    const checked = checkSchemaObject(item, items.length > 1 ? `Item ${i + 1}` : "The schema");
    if (typeof checked === "string") return { error: checked };
    value.push(checked);
  }
  return { value };
}

/** Every block of a scope. Errors are per block (index into `blocks`). */
export function parseSchemas(blocks: unknown): { value: JsonObject[] } | { errors: { index: number; message: string }[] } {
  if (blocks === null || blocks === undefined) return { value: [] };
  if (!Array.isArray(blocks)) return { errors: [{ index: -1, message: "schemas must be a list" }] };
  const value: JsonObject[] = [];
  const errors: { index: number; message: string }[] = [];
  blocks.forEach((block, index) => {
    const parsed = parseSchemaBlock(block);
    if ("error" in parsed) errors.push({ index, message: parsed.error });
    else value.push(...parsed.value);
  });
  if (value.length > MAX_SCHEMAS) errors.push({ index: -1, message: `At most ${MAX_SCHEMAS} schema objects per page` });
  return errors.length ? { errors } : { value };
}

// ── Script snippets ──────────────────────────────────────────────────────────
// Admins paste what a vendor gives them ("add this to your <head>"). Only the
// top level is parsed: script / noscript / meta / link and comments. Anything
// else is refused with a clear message instead of being rendered blindly.

const SCRIPT_ATTRS = new Set(["src", "async", "defer", "type", "id", "crossorigin", "integrity", "referrerpolicy", "nomodule", "charset"]);
const META_ATTRS = new Set(["name", "property", "content", "itemprop"]);
const LINK_ATTRS = new Set(["rel", "href", "as", "crossorigin", "type", "sizes", "media", "hreflang", "title", "referrerpolicy", "integrity"]);
const URL_ATTRS = new Set(["src", "href"]);

// Tags the website already writes. A second copy from a snippet would clash
// with them (or, for robots/noindex, could drop the whole site from Google).
// Mirrored in jmt-frontend server/seo.ts → reservedTagReason.
const PAGE_SEO_HINT = `the page's own SEO section (e.g. Homepage → "SEO (hidden)", or "SEO" on About, Contact, a service, …)`;
const RESERVED_META_NAMES: Record<string, string> = {
  description: `Edit the description in ${PAGE_SEO_HINT} instead`,
  robots: "The website sets robots (indexing) itself",
  googlebot: "The website sets robots (indexing) itself",
  bingbot: "The website sets robots (indexing) itself",
  viewport: "The website sets the viewport itself",
};

/** Why this <meta>/<link> can't be added from a snippet, or null when it can. */
export function reservedTagReason(tag: "meta" | "link", attrs: Record<string, string>): string | null {
  if (tag === "meta") {
    const name = (attrs.name ?? "").trim().toLowerCase();
    const property = (attrs.property ?? "").trim().toLowerCase();
    const label = name ? `<meta name="${name}">` : `<meta property="${property}">`;
    const why =
      RESERVED_META_NAMES[name] ??
      (/^(og|twitter):/.test(name) || /^(og|twitter):/.test(property)
        ? `Share previews (og:/twitter:) come from the title, description and image in ${PAGE_SEO_HINT}`
        : null);
    return why ? `${label} is already on the page. ${why}.` : null;
  }
  const rels = (attrs.rel ?? "").toLowerCase().split(/\s+/);
  if (rels.includes("canonical") || rels.includes("alternate")) {
    return `<link rel="${attrs.rel}"> is already on the page. The website builds canonical and alternate links from the page address.`;
  }
  return null;
}
const SCRIPT_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", "#39": "'", "#34": '"' };
const decodeEntities = (value: string) => value.replace(/&(amp|quot|apos|lt|gt|#39|#34);/g, (_, name: string) => ENTITIES[name]);

/** https:// or protocol-relative only; protocol-relative becomes https. */
function safeUrl(value: string): string | null {
  const url = value.trim().startsWith("//") ? `https:${value.trim()}` : value.trim();
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Reads attributes from `src` starting at `i` up to the closing ">". */
function readAttributes(src: string, start: number): { attrs: [string, string][]; end: number; selfClosing: boolean } | null {
  const attrs: [string, string][] = [];
  let i = start;
  while (i < src.length) {
    while (/\s/.test(src[i] ?? "")) i++;
    if (src[i] === ">") return { attrs, end: i + 1, selfClosing: false };
    if (src.startsWith("/>", i)) return { attrs, end: i + 2, selfClosing: true };
    if (src[i] === "/") {
      i++;
      continue;
    }
    const nameMatch = /^[^\s=>/"']+/.exec(src.slice(i));
    if (!nameMatch) return null;
    const name = nameMatch[0].toLowerCase();
    i += nameMatch[0].length;
    while (/\s/.test(src[i] ?? "")) i++;
    let value = "";
    if (src[i] === "=") {
      i++;
      while (/\s/.test(src[i] ?? "")) i++;
      const quote = src[i];
      if (quote === '"' || quote === "'") {
        const close = src.indexOf(quote, i + 1);
        if (close < 0) return null;
        value = src.slice(i + 1, close);
        i = close + 1;
      } else {
        const bare = /^[^\s>]+/.exec(src.slice(i));
        value = bare ? bare[0] : "";
        i += value.length;
      }
    }
    attrs.push([name, decodeEntities(value)]);
  }
  return null;
}

/** Keeps allowed attributes; refuses event handlers and non-https URLs. */
function filterAttrs(tag: string, raw: [string, string][], allowed: Set<string>): Record<string, string> | string {
  const attrs: Record<string, string> = {};
  for (const [name, value] of raw) {
    if (name.startsWith("on")) return `<${tag}> can't have an event handler attribute (${name})`;
    if (!allowed.has(name) && !name.startsWith("data-")) continue;
    if (URL_ATTRS.has(name)) {
      const url = safeUrl(value);
      if (!url) return `<${tag} ${name}="${value}"> must be an https:// URL`;
      attrs[name] = url;
    } else {
      attrs[name] = value;
    }
  }
  return attrs;
}

/** Index of `</tag` (case-insensitive) from `from`, and the index after its ">". */
function findClose(src: string, tag: string, from: number): { start: number; end: number } | null {
  const match = new RegExp(`</${tag}\\s*>`, "i").exec(src.slice(from));
  return match ? { start: from + match.index, end: from + match.index + match[0].length } : null;
}

/** Turns a pasted snippet into allow-listed nodes, or explains what's wrong. */
export function parseSnippet(code: string): { nodes: SeoNode[] } | { error: string } {
  if (byteLength(code) > MAX_SNIPPET_BYTES) return { error: `The code is too long (over ${MAX_SNIPPET_BYTES / 1000} KB)` };
  const nodes: SeoNode[] = [];
  let i = 0;
  while (i < code.length) {
    if (/\s/.test(code[i])) {
      i++;
      continue;
    }
    if (code.startsWith("<!--", i)) {
      const close = code.indexOf("-->", i + 4);
      if (close < 0) return { error: "An HTML comment (<!--) is never closed (-->)" };
      i = close + 3;
      continue;
    }
    const open = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(code.slice(i));
    if (!open) {
      const text = code.slice(i, i + 40).split("\n")[0];
      return {
        error: `Found text outside a tag: "${text}…". Paste the full snippet with its <script> tags; plain JavaScript must be wrapped in <script>…</script>.`,
      };
    }
    const tag = open[1].toLowerCase();
    const parsed = readAttributes(code, i + open[0].length);
    if (!parsed) return { error: `The <${tag}> tag is never closed (missing ">" or a quote)` };

    if (tag === "script") {
      const close = findClose(code, "script", parsed.end);
      if (!close) return { error: "A <script> is never closed (</script>)" };
      const inner = code.slice(parsed.end, close.start);
      const attrs = filterAttrs(tag, parsed.attrs, SCRIPT_ATTRS);
      if (typeof attrs === "string") return { error: attrs };
      const type = (attrs.type ?? "").trim().toLowerCase();
      if (type === "application/ld+json") {
        const schema = parseSchemaBlock(inner);
        if ("error" in schema) return { error: `JSON-LD in this snippet: ${schema.error}` };
        if (schema.value.length) nodes.push({ tag: "jsonld", data: schema.value.length === 1 ? schema.value[0] : schema.value });
      } else if (!SCRIPT_TYPES.has(type)) {
        return { error: `<script type="${attrs.type}"> isn't supported; use a normal JavaScript script` };
      } else if (attrs.src) {
        if (inner.trim()) return { error: "A <script> with a src can't also contain code" };
        nodes.push({ tag: "script", attrs });
      } else if (inner.trim()) {
        nodes.push({ tag: "script", attrs, inner });
      }
      i = close.end;
    } else if (tag === "noscript") {
      const close = findClose(code, "noscript", parsed.end);
      if (!close) return { error: "A <noscript> is never closed (</noscript>)" };
      const inner = code.slice(parsed.end, close.start).trim();
      if (/<script/i.test(inner)) return { error: "A <noscript> can't contain a <script>" };
      if (inner) nodes.push({ tag: "noscript", inner });
      i = close.end;
    } else if (tag === "meta" || tag === "link") {
      const attrs = filterAttrs(tag, parsed.attrs, tag === "meta" ? META_ATTRS : LINK_ATTRS);
      if (typeof attrs === "string") return { error: attrs };
      if (tag === "meta" && !attrs.content) return { error: '<meta> needs a content="…"' };
      if (tag === "link" && (!attrs.rel || !attrs.href)) return { error: '<link> needs rel="…" and href="…"' };
      const reserved = reservedTagReason(tag, attrs);
      if (reserved) return { error: reserved };
      nodes.push({ tag: tag === "meta" ? "meta" : "link", attrs });
      i = parsed.end;
      // Tolerate a stray closing tag (<meta ...></meta>).
      const stray = new RegExp(`^\\s*</${tag}\\s*>`, "i").exec(code.slice(i));
      if (stray) i += stray[0].length;
    } else {
      return { error: `<${tag}> isn't allowed here. Paste only <script>, <noscript>, <meta> and <link> tags.` };
    }
  }
  return { nodes };
}

const newId = () => Math.random().toString(36).slice(2, 10);

/** What the dashboard sends for one script (nodes are always rebuilt from `code`). */
export interface SeoScriptInput {
  id?: unknown;
  name?: unknown;
  enabled?: unknown;
  timing?: unknown;
  code?: unknown;
}

/**
 * Validates every script of a scope. "Early" only exists site-wide (Next.js
 * runs those from the root layout); on a page it becomes "default".
 */
export function parseScripts(
  input: unknown,
  { global }: { global: boolean },
): { value: SeoScript[] } | { errors: { index: number; message: string }[] } {
  if (input === null || input === undefined) return { value: [] };
  if (!Array.isArray(input)) return { errors: [{ index: -1, message: "scripts must be a list" }] };
  if (input.length > MAX_SCRIPTS) return { errors: [{ index: -1, message: `At most ${MAX_SCRIPTS} scripts` }] };
  const value: SeoScript[] = [];
  const errors: { index: number; message: string }[] = [];
  const ids = new Set<string>();
  input.forEach((raw: SeoScriptInput, index) => {
    if (!isObject(raw)) {
      errors.push({ index, message: "Invalid script entry" });
      return;
    }
    const name = typeof raw.name === "string" ? raw.name.trim().slice(0, MAX_SCRIPT_NAME) : "";
    const code = typeof raw.code === "string" ? raw.code.trim() : "";
    if (!code) {
      errors.push({ index, message: "Paste the script code" });
      return;
    }
    const parsed = parseSnippet(code);
    if ("error" in parsed) {
      errors.push({ index, message: parsed.error });
      return;
    }
    if (parsed.nodes.length === 0) {
      errors.push({ index, message: "Nothing to add: the code has no script, noscript, meta or link tag" });
      return;
    }
    let timing: ScriptTiming = SCRIPT_TIMINGS.includes(raw.timing as ScriptTiming) ? (raw.timing as ScriptTiming) : "default";
    if (timing === "early" && !global) timing = "default";
    let id = typeof raw.id === "string" && /^[a-z0-9]{4,16}$/.test(raw.id) ? raw.id : newId();
    while (ids.has(id)) id = newId();
    ids.add(id);
    value.push({ id, name: name || `Script ${index + 1}`, enabled: raw.enabled !== false, timing, code, nodes: parsed.nodes });
  });
  return errors.length ? { errors } : { value };
}

// ── Built-in schema ──────────────────────────────────────────────────────────

/**
 * JSON-LD the website already outputs (jmt-frontend lib/seo.ts), shown in the
 * dashboard so admins don't add a duplicate.
 */
export function builtInSchemaTypes(scope: string): string[] {
  if (scope === GLOBAL_SCOPE) return ["Organization", "WebSite"];
  if (scope.startsWith("/service/")) return ["BreadcrumbList", "Service"];
  if (scope === "/contact" || scope === "/join-our-crew") return ["BreadcrumbList"];
  return [];
}
