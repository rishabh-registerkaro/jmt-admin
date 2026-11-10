import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Copy an existing block — content, target pages and visibility included — into
// a brand-new DRAFT, so a near-identical block never has to be retyped.
//
// No frontend revalidation happens here on purpose: the copy is a draft, and
// the public by-page endpoint only serves `status: published`, so nothing on
// the live site changes until an admin publishes the copy themselves.

/**
 * First free "<base>", "<base>-2", "<base>-3"… resolved in a single query so
 * duplicating the same block repeatedly never collides on the unique slug.
 */
async function uniqueSlug(base: string): Promise<string> {
  const taken = new Set(
    (
      await prisma.packageBlock.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((b) => b.slug)
  );

  if (!taken.has(base)) return base;
  // taken.size + 2 candidates always covers more names than rows that exist
  for (let n = 2; n <= taken.size + 2; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const authorId = userResult.id;
    if (!authorId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login to duplicate the package block." },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ message: "Slug is required" }, { status: 400 });
    }

    const source = await prisma.packageBlock.findUnique({ where: { slug } });
    if (!source) {
      return NextResponse.json({ message: "Package Block not found" }, { status: 404 });
    }

    // The list falls back to content.heading when title is blank — mirror that
    // here so a copy is never named just "(Copy)".
    const heading = (source.content as { heading?: string } | null)?.heading;
    const baseTitle = source.title?.trim() || heading?.trim() || "Untitled block";

    const copy = await prisma.packageBlock.create({
      data: {
        slug: await uniqueSlug(`${source.slug}-copy`),
        // title is VarChar(500) — trim so an already-long name can't overflow
        title: `${baseTitle} (Copy)`.slice(0, 500),
        targetPages: (source.targetPages ?? []) as Prisma.InputJsonValue,
        content: source.content as Prisma.InputJsonValue,
        // Always a draft, whatever the original was
        status: "draft",
        visible: source.visible,
        // Credited to whoever made the copy, not the original author
        authorId,
      },
    });

    const { authorId: copyAuthorId, ...copyRest } = copy;

    return NextResponse.json(
      {
        message: "Package Block duplicated successfully",
        data: withMongoId({ ...copyRest, author: copyAuthorId }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error duplicating package block", error);
    return NextResponse.json(
      { message: "Internal Server Error — duplicating package block failed" },
      { status: 500 }
    );
  }
}
