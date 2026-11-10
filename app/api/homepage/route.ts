import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";
import {
  HOME_META_DEFAULTS,
  defaultHomeContent,
  normalizeHomeContent,
} from "@/app/lib/content/home-content";

// Homepage singleton (Joy Maa Tara public site, rendered by the jmt-frontend
// project). The frontend reads it through the public GET /api/homepage/client
// (built by server/homepage.ts), so GET here is only used by the admin editor
// and requires a logged-in content user.

/** Cache tag the public homepage reads are tagged with (server/homepage.ts). */
const HOMEPAGE_TAG = "homepage";

const MAX_META_TITLE = 200;
const MAX_META_DESCRIPTION = 500;

/**
 * A server started before `prisma generate` keeps the old client, which has no
 * `homePage` model — every query would throw a vague TypeError. Detect that
 * and tell the admin exactly what to do.
 */
function staleClientResponse(): NextResponse | null {
  const delegate = (prisma as Partial<typeof prisma>).homePage;
  if (delegate && typeof delegate.findFirst === "function") return null;
  console.error("[homepage] Prisma client has no HomePage model — restart the server after `prisma generate`.");
  return NextResponse.json(
    {
      success: false,
      message:
        "The server is running an out-of-date database client. Restart the server (stop and re-run `npm run dev`, or redeploy) and try again.",
    },
    { status: 503 },
  );
}

function errorMessage(action: string, error: unknown): string {
  const detail = error instanceof Error ? error.message.split("\n")[0] : "";
  // Detail is only exposed in development; production keeps the generic text.
  return process.env.NODE_ENV === "development" && detail
    ? `${action} failed: ${detail}`
    : `Internal Server Error - ${action}`;
}

function metaText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function GET(req: NextRequest) {
  const userResult = await requireRole(req, CONTENT_ROLES);
  if (userResult instanceof NextResponse) return userResult;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const homePage = await prisma.homePage.findFirst({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({
      success: true,
      exists: Boolean(homePage),
      homePage: homePage
        ? { ...withMongoId(homePage), content: normalizeHomeContent(homePage.content) }
        : { ...HOME_META_DEFAULTS, content: defaultHomeContent() },
    });
  } catch (error) {
    console.error("Error fetching homepage:", error);
    return NextResponse.json(
      { success: false, message: errorMessage("Loading the homepage", error) },
      { status: 500 },
    );
  }
}

// POST — create or replace the singleton homepage document.
export async function POST(req: NextRequest) {
  const userResult = await requireRole(req, CONTENT_ROLES);
  if (userResult instanceof NextResponse) return userResult;
  const stale = staleClientResponse();
  if (stale) return stale;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.content || typeof body.content !== "object") {
      return NextResponse.json(
        { success: false, message: "content must be a JSON object" },
        { status: 400 },
      );
    }

    const data = {
      metaTitle: metaText(body.metaTitle, MAX_META_TITLE),
      metaDescription: metaText(body.metaDescription, MAX_META_DESCRIPTION),
      // Never trust the client shape: unknown keys are dropped, unsafe URLs
      // reverted, lists capped.
      content: normalizeHomeContent(body.content) as unknown as Prisma.InputJsonValue,
    };

    const existing = await prisma.homePage.findFirst({ select: { id: true }, orderBy: { updatedAt: "desc" } });
    const homePage = existing
      ? await prisma.homePage.update({ where: { id: existing.id }, data })
      : await prisma.homePage.create({ data });

    // Expire the cached DB read ("homepage" tag) here, then on jmt-frontend
    // (its cached fetch and the rendered "/" page), so the very next visit
    // shows the saved content.
    await revalidateFrontendTags([HOMEPAGE_TAG]);

    return NextResponse.json({
      success: true,
      message: "Homepage saved successfully",
      homePage: { ...withMongoId(homePage), content: normalizeHomeContent(homePage.content) },
    });
  } catch (error) {
    console.error("Error saving homepage:", error);
    return NextResponse.json(
      { success: false, message: errorMessage("Saving the homepage", error) },
      { status: 500 },
    );
  }
}
