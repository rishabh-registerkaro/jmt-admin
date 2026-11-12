// Shared helpers for the JMT service page API routes (app/api/jmt-services).

import { NextResponse } from "next/server";
import type { JmtServicePage, PublishStatus } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { SERVICE_SLUG_PATTERN, normalizeServicePage } from "@/lib/service/normalizeServicePage";
import { SITE_LABOUR_SUPPLY } from "@/data/services/siteLabourSupply";
import { revalidateFrontendTags, jmtServiceTags } from "@/app/lib/utils/revalidateFrontend";
import type { ServicePageContent } from "@/types/service";

/** Pages that ship with jmt-frontend; their built-in content is the base for edits. */
const BUILT_IN: Record<string, ServicePageContent> = {
  [SITE_LABOUR_SUPPLY.slug]: SITE_LABOUR_SUPPLY,
};

export const builtInFor = (slug: string): ServicePageContent | undefined => BUILT_IN[slug];

/** Built-in pages not yet saved in the CMS (offered as "import" in the dashboard). */
export const builtInPages = () => Object.values(BUILT_IN);

export const normalizeContent = (raw: unknown, slug: string) => normalizeServicePage(raw, slug, BUILT_IN[slug]);

export const STATUSES: readonly PublishStatus[] = ["draft", "published"];

export function validSlug(value: unknown): string | null {
  return typeof value === "string" && SERVICE_SLUG_PATTERN.test(value) && value.length <= 80 ? value : null;
}

export function validTitle(value: unknown): string | null {
  const title = typeof value === "string" ? value.trim().slice(0, 200) : "";
  return title || null;
}

/** Row → JSON for the dashboard (content always normalized). */
export function serialize(row: JmtServicePage) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    content: normalizeContent(row.content, row.slug),
  };
}

/**
 * A server started before `prisma generate` has no `jmtServicePage` model.
 * Tell the admin to restart instead of failing with a vague TypeError.
 */
export function staleClientResponse(): NextResponse | null {
  const delegate = (prisma as Partial<typeof prisma>).jmtServicePage;
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

export function errorResponse(action: string, error: unknown) {
  console.error(`[jmt-services] ${action} failed:`, error);
  const detail = error instanceof Error ? error.message.split("\n")[0] : "";
  const message =
    process.env.NODE_ENV === "development" && detail ? `${action} failed: ${detail}` : `Internal Server Error - ${action}`;
  return NextResponse.json({ success: false, message }, { status: 500 });
}

/**
 * Expires the given pages on jmt-frontend (best effort, never throws).
 * Goes through revalidateFrontendTags, not revalidateJmtFrontend: the latter
 * skips its call when JMT_FRONTEND_URL equals PRODUCTION_URL (expecting the
 * Global Elite notifier to cover that origin), so on its own it would send nothing.
 */
export const revalidatePages = (...slugs: string[]) => revalidateFrontendTags(jmtServiceTags(...slugs));
