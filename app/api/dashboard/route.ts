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
      prisma.jmtServicePage.count(),
      prisma.jmtServicePage.count({ where: { status: "published" } }),
      prisma.jmtServicePage.count({ where: { status: "draft" } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.jmtServicePage.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
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
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Fetching dashboard statistics",
        ...(process.env.NODE_ENV === "development" ? { error: error instanceof Error ? error.message : String(error) } : {}),
      },
      { status: 500 }
    );
  }
}
