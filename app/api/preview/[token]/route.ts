import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { normalizeSecret } from "@/app/lib/utils/revalidateFrontend";
import { readPreview } from "@/app/lib/server/previewStore";
import { buildHomepagePreview } from "@/server/homepage";
import { isSwitcherLanguage } from "@/types/homepage";

// Server-to-server read of an unsaved draft for jmt-frontend's preview mode
// (jmt-frontend/lib/preview.ts). Guarded by the shared REVALIDATE_SECRET, so
// drafts are never readable from a browser.
//
// ?rev=1          → { rev } only (the preview tab polls this to live-update)
// ?locale=en|bn|hi → for a homepage draft, the bundle built in that language
//
// Answers 200 { draft: null } when the token is unknown or expired.
export const dynamic = "force-dynamic";

function secretMatches(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  const expected = normalizeSecret(process.env.REVALIDATE_SECRET);
  if (!expected || !secretMatches(normalizeSecret(req.headers.get("x-revalidate-secret")), expected)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers });
  }

  const preview = readPreview((await params).token);
  if (!preview) return NextResponse.json({ draft: null, rev: null }, { headers });
  const { draft, rev } = preview;
  if (req.nextUrl.searchParams.get("rev")) return NextResponse.json({ rev }, { headers });

  if (draft.kind === "homepage") {
    const requested = req.nextUrl.searchParams.get("locale");
    const lang = isSwitcherLanguage(requested) ? requested : "en";
    const bundle = await buildHomepagePreview(draft, lang);
    return NextResponse.json({ rev, draft: { kind: "homepage", bundle } }, { headers });
  }
  return NextResponse.json({ rev, draft }, { headers });
}
