import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { normalizeSecret, revalidateJmtFrontend } from "@/app/lib/utils/revalidateFrontend";

const FRONTEND_URL = process.env.PRODUCTION_URL || "http://localhost:3001";

const TAG_PATTERN = /^[a-z0-9_-]{1,100}$/i;

// Manual "revalidate" button in the dashboard. Requires a logged-in CMS user:
// /api is outside the proxy matcher, and without this anyone could make the
// server forward arbitrary tags with its REVALIDATE_SECRET.
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, CONTENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { tags } = await req.json();

    if (
      !Array.isArray(tags) ||
      tags.length === 0 ||
      tags.length > 50 ||
      !tags.every((t) => typeof t === "string" && TAG_PATTERN.test(t))
    ) {
      return NextResponse.json({ success: false, message: "tags array required" }, { status: 400 });
    }

    // GET /api/homepage/client serves cached reads under these tags — expire
    // them locally first, so the frontends re-fetch fresh data.
    for (const tag of tags) revalidateTag(tag, { expire: 0 });

    // The Joy Maa Tara homepage (jmt-frontend) is best effort and never throws;
    // the response below reports on the Global Elite site, as before.
    const [res] = await Promise.all([
      fetch(`${FRONTEND_URL}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": normalizeSecret(process.env.REVALIDATE_SECRET),
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(10000),
      }),
      revalidateJmtFrontend(tags),
    ]);

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ success: false, message: data.message || "Revalidation failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true, revalidated: tags });
  } catch (error: any) {
    console.error("POST /api/revalidate error:", error);
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return NextResponse.json({ success: false, message: "Revalidation request timed out" }, { status: 504 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
