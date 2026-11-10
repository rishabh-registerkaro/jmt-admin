import prisma from "@/app/lib/config/db";
import { withMongoId, withMongoIds } from "@/app/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, PublishStatus } from "@prisma/client";

import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags, serviceTags } from "@/app/lib/utils/revalidateFrontend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authorResult = await requireRole(req, ADMIN_ROLES);
    if (authorResult instanceof NextResponse) {
      return authorResult;
    }
    const authorId = authorResult.id;

    if (!authorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to add the service page.",
        },
        { status: 401 }
      );
    }

    if (!body?.slug || !body?.content || typeof body.content !== "object") {
      return NextResponse.json(
        { message: "Missing required fields: slug and content are required" },
        { status: 400 }
      );
    }
    const slugExists = await prisma.servicePage.findUnique({
      where: { slug: body.slug },
    });

    if (slugExists) {
      return NextResponse.json(
        { message: "Slug already exists. Please use a unique slug." },
        { status: 409 }
      );
    }

    const service = await prisma.servicePage.create({
      data: {
        slug: body.slug,
        template: body.template ?? undefined,
        metaTitle: body.metaTitle ?? undefined,
        metaDescription: body.metaDescription ?? undefined,
        content: body.content as Prisma.InputJsonValue,
        status: (body.status ?? undefined) as PublishStatus | undefined,
        authorId,
      },
    });

    await revalidateFrontendTags(serviceTags(service.slug));

    const { authorId: serviceAuthorId, ...serviceRest } = service;

    return NextResponse.json(
      {
        message: "Service Added Successfully",
        data: withMongoId({ ...serviceRest, author: serviceAuthorId }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Failed to Add Service", error);
    return NextResponse.json(
      {
        message: "Internal Server Error-Adding Service",
        error: error,
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req:NextRequest) {
  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login to access service data." },
        { status: 401}
      );
    }
    // Paginated, and the list only carries what the table shows — the heavy
    // content JSON stays out of the response (title is derived from it here).
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      prisma.servicePage.count(),
      prisma.servicePage.findMany({
        select: {
          id: true,
          slug: true,
          template: true,
          metaTitle: true,
          status: true,
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

    const servicePages = withMongoIds(
      rows.map(({ content, ...rest }) => {
        const c = content as { titleLead?: string; titleAccent?: string; badge?: string } | null;
        const title =
          [c?.titleLead, c?.titleAccent].filter(Boolean).join(" ") ||
          c?.badge ||
          rest.metaTitle ||
          "";
        return { ...rest, title };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        message: " Service Pages Fetched Successfully",
        servicePages,
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
    console.log("Error in fetching all service pages", error);
    return NextResponse.json(
      { message: "Internal Server Error-Error fetching service pages" },
      { status: 500 }
    );
  }
}
