import prisma from "@/app/lib/config/db";
import { withMongoId, withMongoIds } from "@/app/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, PublishStatus } from "@prisma/client";

import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags, packageTags } from "@/app/lib/utils/revalidateFrontend";
import { normalizeTargetPages } from "@/app/lib/content/package-content";

// Package blocks are admin-only across the board — unlike service pages, every
// verb here (including reads) requires admin or superadmin.

export async function POST(req: NextRequest) {
  try {
    const authorResult = await requireRole(req, ADMIN_ROLES);
    if (authorResult instanceof NextResponse) {
      return authorResult;
    }
    const authorId = authorResult.id;

    if (!authorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to add the package block.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body?.slug || !body?.content || typeof body.content !== "object") {
      return NextResponse.json(
        { message: "Missing required fields: slug and content are required" },
        { status: 400 }
      );
    }

    const slugExists = await prisma.packageBlock.findUnique({
      where: { slug: body.slug },
    });

    if (slugExists) {
      return NextResponse.json(
        { message: "Slug already exists. Please use a unique slug." },
        { status: 409 }
      );
    }

    const targetPages = normalizeTargetPages(body.targetPages);

    const block = await prisma.packageBlock.create({
      data: {
        slug: body.slug,
        title: body.title ?? "",
        targetPages: targetPages as Prisma.InputJsonValue,
        content: body.content as Prisma.InputJsonValue,
        status: (body.status ?? undefined) as PublishStatus | undefined,
        visible: typeof body.visible === "boolean" ? body.visible : undefined,
        authorId,
      },
    });

    await revalidateFrontendTags(packageTags(targetPages));

    const { authorId: blockAuthorId, ...blockRest } = block;

    return NextResponse.json(
      {
        message: "Package Block Added Successfully",
        data: withMongoId({ ...blockRest, author: blockAuthorId }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Failed to Add Package Block", error);
    return NextResponse.json(
      {
        message: "Internal Server Error-Adding Package Block",
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login to access package blocks." },
        { status: 401 }
      );
    }

    // Paginated. The list carries only what the table shows — the heavy content
    // JSON stays out of the response, but the package count is derived here.
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      prisma.packageBlock.count(),
      prisma.packageBlock.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          targetPages: true,
          status: true,
          visible: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const packageBlocks = withMongoIds(
      rows.map(({ content, ...rest }) => {
        const c = content as { heading?: string; tabs?: { packages?: unknown[] }[] } | null;
        const packageCount = (c?.tabs ?? []).reduce(
          (sum, tab) => sum + (Array.isArray(tab?.packages) ? tab.packages.length : 0),
          0
        );
        return {
          ...rest,
          title: rest.title || c?.heading || "",
          tabCount: (c?.tabs ?? []).length,
          packageCount,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        message: "Package Blocks Fetched Successfully",
        packageBlocks,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error in fetching all package blocks", error);
    return NextResponse.json(
      { message: "Internal Server Error-Error fetching package blocks" },
      { status: 500 }
    );
  }
}
