import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";

export async function GET(req: NextRequest) {
  try {
    const userResult = await getCurrentUser(req);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login to perform changes" },
        { status: 401 }
      );
    }

    // Two modes:
    //  • no `page` param → ALL categories (back-compat: blog editor pickers,
    //    parent-category dropdowns)
    //  • `?page=N` → paginated chunk (skip/take) with parent names resolved,
    //    used by the Categories listing table
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");

    const select = {
      id: true,
      name: true,
      slug: true,
      color: true,
      createdAt: true,
      updatedAt: true,
      parentId: true,
      parent: { select: { name: true } },
    } as const;

    type Row = {
      id: string;
      name: string;
      slug: string;
      color: string;
      createdAt: Date;
      updatedAt: Date;
      parentId: string | null;
      parent: { name: string } | null;
    };

    const format = (category: Row) => ({
      _id: category.id,
      name: category.name,
      slug: category.slug,
      color: category.color || "",
      parentCategory: category.parentId ? category.parentId : null,
      parentName: category.parent?.name ?? null,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });

    if (pageParam === null) {
      const categories = await prisma.category.findMany({
        select,
        orderBy: { createdAt: "desc" },
      });
      const formattedCategories = categories.map(format);
      return NextResponse.json(
        {
          success: true,
          message: "Categories fetched successfully",
          categories: formattedCategories,
          count: formattedCategories.length,
        },
        { status: 200 }
      );
    }

    const page = Math.max(1, parseInt(pageParam) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const [total, categories] = await Promise.all([
      prisma.category.count(),
      prisma.category.findMany({
        select,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        message: "Categories fetched successfully",
        categories: categories.map(format),
        count: total,
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
  } catch (error: any) {
    console.error("Error fetching categories:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch categories.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
