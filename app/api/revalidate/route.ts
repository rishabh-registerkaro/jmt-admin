import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { MAX_TAGS_PER_REQUEST } from "@/app/lib/utils/cacheTags";
import { revalidateFrontendTags, statusForResults } from "@/app/lib/utils/revalidateFrontend";

const TAG_PATTERN = /^[a-z0-9_-]{1,100}$/i;

// Manual "revalidate" button in the dashboard. Requires a logged-in CMS user:
// /api is outside the proxy matcher, and without this anyone could make the
// server forward arbitrary tags with its REVALIDATE_SECRET.
//
// Expires the tags locally and on both frontends, and reports each site
// separately in `sites` so the dashboard can say which one failed.
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, CONTENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => null);
    const tags: unknown = body?.tags;

    if (
      !Array.isArray(tags) ||
      tags.length === 0 ||
      tags.length > MAX_TAGS_PER_REQUEST ||
      !tags.every((t) => typeof t === "string" && TAG_PATTERN.test(t))
    ) {
      return NextResponse.json({ success: false, message: "tags array required" }, { status: 400 });
    }

    const sites = await revalidateFrontendTags(tags as string[]);
    const status = statusForResults(sites);

    return NextResponse.json(
      {
        success: status === 200,
        revalidated: tags,
        sites,
        ...(status === 200 ? {} : { message: "Revalidation failed on one or more sites" }),
      },
      { status },
    );
  } catch (error) {
    console.error("POST /api/revalidate error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
