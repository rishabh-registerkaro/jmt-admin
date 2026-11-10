// app/api/post/filter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";
import prisma from "@/app/lib/config/db";
import { Prisma } from "@prisma/client";
import { withMongoIds } from "@/app/lib/utils/serialize";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || '';
    const status = searchParams.get("status") as "draft" | "published" | null;
    const authorId = searchParams.get("author");
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // Auth
    const userResult = await getCurrentUser(req);
    if (userResult instanceof NextResponse) return userResult;

    const userId = userResult.id?.toString();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    // Build Query
    const query: Prisma.PostWhereInput = {};

    if (search) query.title = { contains: search };
    if (status) {
      // An unknown status matched no documents in Mongo — keep that behavior
      // (Prisma would otherwise reject the invalid enum value).
      if (status !== "draft" && status !== "published") {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasMore: false }
        });
      }
      query.status = status;
    }

    // Author Filter
    if (authorId) {
      if (typeof authorId !== "string" || authorId.trim().length === 0) {
        return NextResponse.json({ success: false, message: "Invalid author ID" }, { status: 400 });
      }
      query.authorId = authorId;
    } else {
      if (status === 'draft') {
        query.authorId = userId;
        query.status = 'draft';
      } else {
        query.OR = [
          { status: 'published' },
          { authorId: userId, status: 'draft' }
        ];
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: query,
        // MINIMAL & FAST Projection — only what you asked for
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          author: { select: { id: true, username: true } }, // only username needed
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.post.count({ where: query })
    ]);

    return NextResponse.json({
      success: true,
      data: withMongoIds(posts),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

  } catch (error: any) {
    console.error('Filter API Error:', error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
