// Server helpers for SEO & Scripts (app/api/seo). Shapes and validation are in
// app/lib/content/seo.ts; this file reads/writes the `jmt_seo` table, lists the
// pages an admin can pick, and refreshes jmt-frontend after a change.

import { NextResponse } from "next/server";
import type { JmtSeo } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { SITE_PAGES, SITE_PAGE_KEYS } from "@/app/lib/content/site-pages";
import {
  GLOBAL_SCOPE,
  builtInSchemaTypes,
  parseSchemas,
  parseScripts,
  validateGtmId,
  type JsonObject,
  type SeoScript,
} from "@/app/lib/content/seo";
import { JMT_SEO_TAG } from "@/app/lib/utils/cacheTags";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

/** Public path of a JMT service page (jmt-frontend lib/siteLinks.ts → servicePath). */
export const servicePagePath = (slug: string) => `/service/${slug}`;

// ── Reading saved values ─────────────────────────────────────────────────────
// Saved JSON is re-validated on the way out, so a hand-edited row can never
// send something the editor wouldn't accept.

export function readSchemas(raw: unknown): JsonObject[] {
  const parsed = parseSchemas(Array.isArray(raw) ? raw : []);
  return "value" in parsed ? parsed.value : [];
}

export function readScripts(raw: unknown, scope: string): SeoScript[] {
  if (!Array.isArray(raw)) return [];
  // Validate one by one so a single bad entry doesn't hide the others.
  return raw.flatMap((entry) => {
    const parsed = parseScripts([entry], { global: scope === GLOBAL_SCOPE });
    return "value" in parsed ? parsed.value : [];
  });
}

export function readGtmId(raw: unknown): string | null {
  const parsed = validateGtmId(raw);
  return "value" in parsed ? parsed.value : null;
}

/** One scope as the dashboard sees it. */
export function serializeEntry(scope: string, row: JmtSeo | null) {
  return {
    scope,
    exists: Boolean(row),
    updatedAt: row?.updatedAt ?? null,
    gtmId: scope === GLOBAL_SCOPE ? readGtmId(row?.gtmId) : null,
    schemas: readSchemas(row?.schemas),
    // `nodes` are rebuilt from `code` on every save; the editor only needs the code.
    scripts: readScripts(row?.scripts, scope).map(({ id, name, enabled, timing, code }) => ({ id, name, enabled, timing, code })),
    builtIn: builtInSchemaTypes(scope),
  };
}

// ── Pages an admin can add SEO to ────────────────────────────────────────────

export interface SeoPageEntry {
  scope: string;
  label: string;
  kind: "page" | "service" | "orphaned";
  /** Service pages only: not published yet. */
  draft?: boolean;
  schemaCount: number;
  scriptCount: number;
  updatedAt: Date | null;
}

/**
 * Home, the fixed site pages, every JMT service page, then any saved row
 * whose page no longer exists ("orphaned"), so nothing disappears silently.
 */
export async function seoPageList(rows: JmtSeo[]): Promise<SeoPageEntry[]> {
  const services = await prisma.jmtServicePage.findMany({
    select: { slug: true, title: true, status: true },
    orderBy: { title: "asc" },
  });
  const byScope = new Map(rows.map((row) => [row.scope, row]));
  const entry = (scope: string, label: string, kind: SeoPageEntry["kind"], draft?: boolean): SeoPageEntry => {
    const row = byScope.get(scope) ?? null;
    return {
      scope,
      label,
      kind,
      ...(draft ? { draft } : {}),
      schemaCount: readSchemas(row?.schemas).length,
      scriptCount: readScripts(row?.scripts, scope).length,
      updatedAt: row?.updatedAt ?? null,
    };
  };

  const pages: SeoPageEntry[] = [
    entry("/", "Homepage", "page"),
    ...SITE_PAGE_KEYS.map((key) => entry(SITE_PAGES[key].path, SITE_PAGES[key].title, "page")),
    ...services.map((s) => entry(servicePagePath(s.slug), s.title, "service", s.status !== "published")),
  ];
  const known = new Set(pages.map((p) => p.scope));
  for (const row of rows) {
    if (row.scope !== GLOBAL_SCOPE && !known.has(row.scope)) pages.push(entry(row.scope, row.scope, "orphaned"));
  }
  return pages;
}

// ── Keeping service rows in sync ─────────────────────────────────────────────

/**
 * Moves a service page's SEO when its slug changes, or deletes it with the page
 * (`to` = null). Best effort: never fails the service save.
 */
export async function moveServiceSeo(fromSlug: string, toSlug: string | null): Promise<void> {
  if (toSlug === fromSlug) return;
  const from = servicePagePath(fromSlug);
  try {
    const delegate = (prisma as Partial<typeof prisma>).jmtSeo;
    if (!delegate) return;
    const row = await prisma.jmtSeo.findUnique({ where: { scope: from }, select: { id: true } });
    if (!row) return;
    if (toSlug === null) {
      await prisma.jmtSeo.delete({ where: { id: row.id } });
    } else {
      const to = servicePagePath(toSlug);
      // A leftover row at the new path belonged to an older page with that slug.
      await prisma.$transaction([
        prisma.jmtSeo.deleteMany({ where: { scope: to } }),
        prisma.jmtSeo.update({ where: { id: row.id }, data: { scope: to } }),
      ]);
    }
    await revalidateSeo();
  } catch (error) {
    console.error(`[seo] moving the SEO of "${from}" failed:`, error);
  }
}

// ── Responses & revalidation ─────────────────────────────────────────────────

/** A server started before `prisma generate` has no `jmtSeo` model: ask for a restart. */
export function staleClientResponse(): NextResponse | null {
  const delegate = (prisma as Partial<typeof prisma>).jmtSeo;
  if (delegate && typeof delegate.findFirst === "function") return null;
  return NextResponse.json(
    {
      success: false,
      message:
        "The server is running an out-of-date database client. Run `npx prisma db push`, restart the server and try again.",
    },
    { status: 503 },
  );
}

/** Prisma P2021: the `jmt_seo` table hasn't been created yet (`npm run db:push` not run). */
export const isMissingTable = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2021";

export function errorResponse(action: string, error: unknown) {
  if (isMissingTable(error)) {
    console.error(`[seo] ${action} failed: the jmt_seo table doesn't exist. Run \`npm run db:push\` in jmt-admin.`);
    return NextResponse.json(
      {
        success: false,
        message: "The SEO table isn't in the database yet. Run `npm run db:push` in jmt-admin, then reload this page.",
      },
      { status: 503 },
    );
  }
  console.error(`[seo] ${action} failed:`, error);
  const detail = error instanceof Error ? error.message.split("\n")[0] : "";
  const message =
    process.env.NODE_ENV === "development" && detail ? `${action} failed: ${detail}` : `Internal Server Error - ${action}`;
  return NextResponse.json({ success: false, message }, { status: 500 });
}

/** Every page shows the global row, so one tag covers all of it (best effort, never throws). */
export const revalidateSeo = () => revalidateFrontendTags([JMT_SEO_TAG]);
