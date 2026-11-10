import prisma from "@/app/lib/config/db";
import { withMongoIds } from "@/app/lib/utils/serialize";
import { getCorsHeaders } from "@/app/lib/utils/corsHeader";
import { NextRequest, NextResponse } from "next/server";

// Public endpoint the website calls while rendering a page: "which published
// package blocks are injected into /<slug>?". Blocks name their target pages in
// a JSON array, so the match is done in two cheap steps rather than with a
// dialect-specific JSON query:
//   1. read slug + targetPages for every published block (tiny rows)
//   2. fetch full content only for the blocks that actually match
// Blocks are returned oldest-first so their order on the page is stable.

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(req) });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const headers = getCorsHeaders(req);
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json(
        { message: "Page slug is required", packageBlocks: [] },
        { status: 400, headers }
      );
    }

    // `visible: false` hides a block from the live site while leaving it
    // published — the admin's on/off switch.
    const candidates = await prisma.packageBlock.findMany({
      where: { status: "published", visible: true },
      select: { slug: true, targetPages: true },
    });

    const matchedSlugs = candidates
      .filter(({ targetPages }) =>
        Array.isArray(targetPages) &&
        targetPages.some((p) => typeof p === "string" && p === slug)
      )
      .map((b) => b.slug);

    if (matchedSlugs.length === 0) {
      return NextResponse.json(
        { message: "No package blocks for this page", packageBlocks: [] },
        { status: 200, headers }
      );
    }

    const blocks = await prisma.packageBlock.findMany({
      where: { slug: { in: matchedSlugs } },
      select: {
        id: true,
        slug: true,
        title: true,
        targetPages: true,
        content: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        message: "Package Blocks Fetched Successfully",
        packageBlocks: withMongoIds(blocks),
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.log("Error fetching package blocks for page", error);
    return NextResponse.json(
      {
        message: "Internal Server Error-Error fetching package blocks",
        packageBlocks: [],
      },
      { status: 500, headers }
    );
  }
}
