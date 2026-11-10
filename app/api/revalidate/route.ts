import { NextRequest, NextResponse } from "next/server";
import { normalizeSecret } from "@/app/lib/utils/revalidateFrontend";

const FRONTEND_URL = process.env.PRODUCTION_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const { tags } = await req.json();

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ success: false, message: "tags array required" }, { status: 400 });
    }

    const res = await fetch(`${FRONTEND_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": normalizeSecret(process.env.REVALIDATE_SECRET),
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(10000),
    });

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
