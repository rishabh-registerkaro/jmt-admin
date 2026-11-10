import prisma from "@/app/lib/config/db";
import { withMongoIds } from "@/app/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";

export async function GET(req: NextRequest) {
  try {
    const userResult = await getCurrentUser(req);
    if (userResult instanceof NextResponse) return userResult;

    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login to access dashboard." },
        { status: 401 }
      );
    }

    const [
      totalUsers,
      totalServices,
      publishedServices,
      draftServices,
      totalPosts,
      publishedPosts,
      draftPosts,
      totalLeads,
      newLeads,
      recentServices,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.servicePage.count(),
      prisma.servicePage.count({ where: { status: "published" } }),
      prisma.servicePage.count({ where: { status: "draft" } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.servicePage.findMany({
        select: {
          id: true,
          slug: true,
          status: true,
          content: true,
          updatedAt: true,
          author: { select: { id: true, username: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          users: { total: totalUsers },
          services: {
            total: totalServices,
            published: publishedServices,
            draft: draftServices,
          },
          posts: {
            total: totalPosts,
            published: publishedPosts,
            draft: draftPosts,
          },
          leads: {
            total: totalLeads,
            new: newLeads,
          },
          recentServices: withMongoIds(recentServices),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching dashboard statistics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Fetching dashboard statistics",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
