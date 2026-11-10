import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, PublishStatus } from "@prisma/client";
import { revalidateFrontendTags, packageTags } from "@/app/lib/utils/revalidateFrontend";
import { normalizeTargetPages } from "@/app/lib/content/package-content";

/** Stored targetPages come back from Prisma as JsonValue — narrow to string[]. */
const readTargets = (value: Prisma.JsonValue): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ message: "Slug is required" }, { status: 400 });
    }

    const block = await prisma.packageBlock.findUnique({ where: { slug } });
    if (!block) {
      return NextResponse.json({ message: "Package Block Not Found" }, { status: 404 });
    }

    const { authorId, ...rest } = block;
    return NextResponse.json(
      {
        message: "Package Block fetched successfully",
        data: withMongoId({ ...rest, author: authorId }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching package block", error);
    return NextResponse.json(
      { message: "Internal Server Error-fetching package block", error: error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const { slug: newSlug, ...rest } = await req.json();

    if (newSlug && newSlug !== slug) {
      const existing = await prisma.packageBlock.findUnique({
        where: { slug: newSlug },
      });
      if (existing) {
        return NextResponse.json(
          {
            message: `Slug "${newSlug}" is already taken. Please choose a different slug.`,
          },
          { status: 409 }
        );
      }
    }

    const existingBlock = await prisma.packageBlock.findUnique({ where: { slug } });
    if (!existingBlock) {
      return NextResponse.json({ message: "Package Block not found" }, { status: 404 });
    }

    const data: Prisma.PackageBlockUpdateInput = {};
    if (newSlug) data.slug = newSlug;
    if (rest.title !== undefined) data.title = rest.title;
    if (rest.targetPages !== undefined) {
      data.targetPages = normalizeTargetPages(rest.targetPages) as Prisma.InputJsonValue;
    }
    if (rest.content !== undefined) {
      if (!rest.content || typeof rest.content !== "object") {
        return NextResponse.json(
          { message: "content must be a JSON object" },
          { status: 400 }
        );
      }
      data.content = rest.content as Prisma.InputJsonValue;
    }
    if (rest.status !== undefined) data.status = rest.status as PublishStatus;
    // Sent on its own by the list page's show/hide switch, and alongside
    // everything else when the full form is saved.
    if (typeof rest.visible === "boolean") data.visible = rest.visible;

    const updated = await prisma.packageBlock.update({ where: { slug }, data });

    // Clear the pages this block used to sit on as well as the ones it now
    // targets — otherwise a removed page keeps serving the old block for an hour.
    const tags = new Set([
      ...packageTags(readTargets(existingBlock.targetPages)),
      ...packageTags(readTargets(updated.targetPages)),
    ]);
    await revalidateFrontendTags([...tags]);

    const { authorId: updatedAuthorId, ...updatedRest } = updated;
    return NextResponse.json(
      {
        message: "Package Block updated successfully",
        updatedBlock: withMongoId({ ...updatedRest, author: updatedAuthorId }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error while editing package block", error);
    return NextResponse.json(
      { message: "Internal Server error-Editing package block", error: error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const existingBlock = await prisma.packageBlock.findUnique({ where: { slug } });
    if (!existingBlock) {
      return NextResponse.json({ message: "Package Block not found" }, { status: 404 });
    }

    const deleted = await prisma.packageBlock.delete({ where: { slug } });

    // Remove the block from every page it was injected into, immediately
    await revalidateFrontendTags(packageTags(readTargets(deleted.targetPages)));

    const { authorId, ...rest } = deleted;

    return NextResponse.json(
      {
        message: "Package Block deleted successfully",
        deletedBlock: withMongoId({ ...rest, author: authorId }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting package block", error);
    return NextResponse.json(
      { message: "Internal Server Error — deleting package block failed" },
      { status: 500 }
    );
  }
}
