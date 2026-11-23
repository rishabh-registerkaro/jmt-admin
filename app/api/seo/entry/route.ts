import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { hasPermission, requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { GLOBAL_SCOPE, normalizeScope, parseSchemas, parseScripts, validateGtmId } from "@/app/lib/content/seo";
import { errorResponse, revalidateSeo, serializeEntry, staleClientResponse } from "@/app/lib/server/jmtSeo";

// One SEO scope: ?scope=global (every page) or ?scope=/about (one page).
//   GET    — read
//   PUT    — save. Body: any of { gtmId, scripts, schemas }.
//            schemas need seo.manage; gtmId and scripts need seo.scripts
//            (they run code on the live site). Fields the user can't edit
//            are left as they are.
//   DELETE — clear the scope

const SEO_PERMISSIONS = [PERMISSIONS.SEO_MANAGE, PERMISSIONS.SEO_SCRIPTS];

const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status });

function scopeOf(req: NextRequest): string | NextResponse {
  const scope = normalizeScope(req.nextUrl.searchParams.get("scope"));
  return scope ?? json(400, { success: false, message: 'scope must be "global" or a page path such as "/about"' });
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, SEO_PERMISSIONS);
  if (auth instanceof NextResponse) return auth;
  const scope = scopeOf(req);
  if (scope instanceof NextResponse) return scope;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const row = await prisma.jmtSeo.findUnique({ where: { scope } });
    return NextResponse.json({ success: true, ...serializeEntry(scope, row) });
  } catch (error) {
    return errorResponse(`Loading SEO for "${scope}"`, error);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requirePermission(req, SEO_PERMISSIONS);
  if (auth instanceof NextResponse) return auth;
  const scope = scopeOf(req);
  if (scope instanceof NextResponse) return scope;
  const stale = staleClientResponse();
  if (stale) return stale;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json(400, { success: false, message: "Body must be a JSON object" });
  }
  const isGlobal = scope === GLOBAL_SCOPE;
  const canSchemas = hasPermission(auth, PERMISSIONS.SEO_MANAGE);
  const canScripts = hasPermission(auth, PERMISSIONS.SEO_SCRIPTS);

  const data: Prisma.JmtSeoUpdateInput = {};
  const errors: { field: string; index: number; message: string }[] = [];

  if (canSchemas && "schemas" in body) {
    const parsed = parseSchemas(body.schemas);
    if ("errors" in parsed) errors.push(...parsed.errors.map((e) => ({ field: "schemas", ...e })));
    else data.schemas = parsed.value as Prisma.InputJsonValue[];
  }
  if (canScripts && "scripts" in body) {
    const parsed = parseScripts(body.scripts, { global: isGlobal });
    if ("errors" in parsed) errors.push(...parsed.errors.map((e) => ({ field: "scripts", ...e })));
    else data.scripts = parsed.value as unknown as Prisma.InputJsonValue;
  }
  if (canScripts && "gtmId" in body) {
    if (!isGlobal && body.gtmId) {
      errors.push({ field: "gtmId", index: -1, message: "The GTM container is site-wide: set it on the Site-wide tab" });
    } else if (isGlobal) {
      const parsed = validateGtmId(body.gtmId);
      if ("error" in parsed) errors.push({ field: "gtmId", index: -1, message: parsed.error });
      else data.gtmId = parsed.value;
    }
  }

  if (errors.length) {
    return json(400, { success: false, message: errors[0].message, errors });
  }
  if (Object.keys(data).length === 0) {
    return json(403, { success: false, message: "You don't have permission to change these settings" });
  }

  try {
    const row = await prisma.jmtSeo.upsert({
      where: { scope },
      create: { ...(data as Omit<Prisma.JmtSeoCreateInput, "scope">), scope },
      update: data,
    });
    const sites = await revalidateSeo();
    return NextResponse.json({
      success: true,
      message: "SEO saved",
      revalidated: sites.every((s) => s.ok),
      ...serializeEntry(scope, row),
    });
  } catch (error) {
    return errorResponse(`Saving SEO for "${scope}"`, error);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission(req, SEO_PERMISSIONS);
  if (auth instanceof NextResponse) return auth;
  const scope = scopeOf(req);
  if (scope instanceof NextResponse) return scope;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const row = await prisma.jmtSeo.findUnique({ where: { scope } });
    if (!row) return NextResponse.json({ success: true, message: "Nothing to clear", ...serializeEntry(scope, null) });

    // Clearing removes everything in the row, so the user must be allowed to edit all of it.
    const entry = serializeEntry(scope, row);
    const hasScripts = Boolean(entry.gtmId) || entry.scripts.length > 0;
    const hasSchemas = entry.schemas.length > 0;
    if ((hasScripts && !hasPermission(auth, PERMISSIONS.SEO_SCRIPTS)) || (hasSchemas && !hasPermission(auth, PERMISSIONS.SEO_MANAGE))) {
      return json(403, { success: false, message: "This page has settings you don't have permission to remove" });
    }

    await prisma.jmtSeo.delete({ where: { scope } });
    await revalidateSeo();
    return NextResponse.json({ success: true, message: "SEO cleared", ...serializeEntry(scope, null) });
  } catch (error) {
    return errorResponse(`Clearing SEO for "${scope}"`, error);
  }
}
