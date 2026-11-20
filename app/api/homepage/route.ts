import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS, CONTENT_PERMISSIONS } from "@/app/lib/constants/permissions";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";
import {
  HOME_META_DEFAULTS,
  defaultHomeContent,
  normalizeHomeContent,
  type HomePageContent,
} from "@/app/lib/content/home-content";

// Homepage singleton (Joy Maa Tara public site, rendered by the jmt-frontend
// project). The frontend reads it through the public GET /api/homepage/client
// (built by server/homepage.ts), so GET here is only used by the admin editor
// and requires a logged-in content user.

/** Cache tag the public homepage reads are tagged with (server/homepage.ts). */
const HOMEPAGE_TAG = "homepage";

const MAX_META_TITLE = 191; // home_pages.metaTitle is VARCHAR(191)
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

/**
 * The navbar ("header") and footer live in content.site but are edited on
 * Dashboard → Menus (app/dashboard/site-menus/[part]), which save with
 * `part`. Returns `target` with the given parts copied from `source`.
 */
type MenuPart = "header" | "footer";

function withMenuParts(target: HomePageContent, source: HomePageContent, parts: MenuPart[]): HomePageContent {
  const site = { ...target.site, brand: { ...target.site.brand }, labels: { ...target.site.labels } };
  const from = source.site;
  if (parts.includes("header")) {
    site.brand.name = from.brand.name;
    site.brand.headerLogo = from.brand.headerLogo;
    site.nav = from.nav;
  }
  if (parts.includes("footer")) {
    site.brand.footerLogo = from.brand.footerLogo;
    site.footerDescription = from.footerDescription;
    site.footerColumns = from.footerColumns;
    site.labels.footerContactTitle = from.labels.footerContactTitle;
    site.labels.whatsappDisplay = from.labels.whatsappDisplay;
    site.copyright = from.copyright;
  }
  return { ...target, site };
}

const CONTACT_FIELDS = ["phone", "whatsapp", "email", "hours"] as const;

/**
 * The Footer Menu's Contact column edits these Homepage → Contact details
 * fields too. Take only the ones it changed from what it loaded (`base`), so
 * saving the footer can't revert a newer edit made in the Homepage editor.
 */
function withFooterContact(target: HomePageContent, submitted: HomePageContent, base: unknown): HomePageContent {
  const loaded = base && typeof base === "object" ? (base as Record<string, unknown>) : null;
  const site = { ...target.site };
  for (const f of CONTACT_FIELDS) {
    if (!loaded || submitted.site[f] !== loaded[f]) site[f] = submitted.site[f];
  }
  return { ...target, site };
}

function metaText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function GET(req: NextRequest) {
  const userResult = await requirePermission(req, CONTENT_PERMISSIONS);
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
  const userResult = await requirePermission(req, PERMISSIONS.CONTENT_EDIT);
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

    // Never trust the client shape: unknown keys are dropped, unsafe URLs
    // reverted, lists capped.
    const submitted = normalizeHomeContent(body.content);
    const part: MenuPart | null = body.part === "header" || body.part === "footer" ? body.part : null;

    // Read-modify-write guarded by updatedAt, so two saves landing together
    // (homepage editor, Header Menu, Footer Menu) can't silently undo each other.
    let homePage = null;
    for (let attempt = 0; !homePage; attempt++) {
      const existing = await prisma.homePage.findFirst({ orderBy: { updatedAt: "desc" } });
      const saved = existing ? normalizeHomeContent(existing.content) : defaultHomeContent();
      const data = part
        ? // Header/Footer Menu: only that part changes; SEO fields stay as saved.
          {
            metaTitle: existing?.metaTitle ?? null,
            metaDescription: existing?.metaDescription ?? null,
            content: (part === "footer"
              ? withFooterContact(withMenuParts(saved, submitted, [part]), submitted, body.contactBase)
              : withMenuParts(saved, submitted, [part])) as unknown as Prisma.InputJsonValue,
          }
        : // Homepage editor: everything except the navbar and footer, which keep their saved values.
          {
            metaTitle: metaText(body.metaTitle, MAX_META_TITLE),
            metaDescription: metaText(body.metaDescription, MAX_META_DESCRIPTION),
            content: (existing ? withMenuParts(submitted, saved, ["header", "footer"]) : submitted) as unknown as Prisma.InputJsonValue,
          };

      if (!existing) {
        homePage = await prisma.homePage.create({ data });
      } else {
        const { count } = await prisma.homePage.updateMany({
          where: { id: existing.id, updatedAt: existing.updatedAt },
          data,
        });
        if (count === 1) homePage = await prisma.homePage.findUniqueOrThrow({ where: { id: existing.id } });
        else if (attempt >= 2) {
          return NextResponse.json(
            { success: false, message: "The homepage was being saved by someone else at the same moment. Please save again." },
            { status: 409 },
          );
        }
      }
    }

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
