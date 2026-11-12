import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { normalizeHomeContent } from "@/app/lib/content/home-content";
import { isSitePageKey, normalizeSitePage } from "@/app/lib/server/jmtSitePages";
import { normalizeContent, validSlug } from "@/app/lib/server/jmtServicePages";
import { savePreview, type PreviewDraft } from "@/app/lib/server/previewStore";

// POST — store an unsaved editor draft for the dashboard's Preview button.
// Nothing is written to the database and the live website is unchanged; the
// preview tab on jmt-frontend reads the draft through GET /api/preview/[token].
//
// Body: { kind: "homepage", metaTitle, metaDescription, content }
//     | { kind: "service", slug, content }
//     | { kind: "site-page", key, content }
//     + optional `token` to update an open preview instead of starting a new one.
// Answers { success, token, rev }.

const MAX_BODY_BYTES = 2 * 1024 * 1024;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const metaText = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

const bad = (message: string) => NextResponse.json({ success: false, message }, { status: 400 });

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, CONTENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  const text = await req.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return bad("The page is too large to preview");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return bad("Invalid request body");
  }
  if (!isObject(body) || !isObject(body.content)) return bad("content must be a JSON object");

  // Same normalizers as saving, so the preview shows exactly what Save would publish.
  let draft: PreviewDraft;
  switch (body.kind) {
    case "homepage":
      draft = {
        kind: "homepage",
        metaTitle: metaText(body.metaTitle, 200),
        metaDescription: metaText(body.metaDescription, 500),
        content: normalizeHomeContent(body.content),
      };
      break;
    case "service": {
      const slug = validSlug(body.slug);
      if (!slug) return bad("Slug must be lower-case letters, numbers and hyphens");
      draft = { kind: "service", slug, content: normalizeContent(body.content, slug) };
      break;
    }
    case "site-page":
      if (!isSitePageKey(body.key)) return bad("Unknown page");
      draft = { kind: "site-page", key: body.key, content: normalizeSitePage(body.key, body.content) };
      break;
    default:
      return bad("kind must be homepage, service or site-page");
  }

  const { token, rev } = savePreview(draft, auth.id, body.token);
  return NextResponse.json({ success: true, token, rev }, { headers: { "Cache-Control": "no-store" } });
}
