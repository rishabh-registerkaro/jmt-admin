import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get CORS headers based on origin
const getCorsHeaders = (origin: string | null) => {
    const PRODUCTION_URL = process.env.PRODUCTION_URL || '';
    if (origin === PRODUCTION_URL) {
        return {
            'Access-Control-Allow-Origin': PRODUCTION_URL,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
    }
    // Check if origin is localhost with any port
    if (origin && origin.startsWith('http://localhost:')) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
    }
    // Default: allow production URL
    return {
        'Access-Control-Allow-Origin': PRODUCTION_URL,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
};
// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin');
    return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
    try {
        // Get query parameters
        const { searchParams } = new URL(req.url);
        const categoryParam = searchParams.get("category") || "";

        // Pagination parameters (only used when fetching posts)
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = 10; // Fixed limit of 10 posts per page

        // If no category parameter, return all categories (no pagination)
        if (!categoryParam || categoryParam.trim().length === 0) {
            const categories = await prisma.category.findMany({
                select: { id: true, name: true, slug: true },
                orderBy: { name: "asc" },
            });

            const formattedCategories = categories.map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
            }));

            const origin = req.headers.get('origin');
            return NextResponse.json({
                success: true,
                categories: formattedCategories,
                count: formattedCategories.length,
            }, {
                status: 200,
                headers: getCorsHeaders(origin)
            });
        }

        // Category parameter provided - find posts by category with pagination
        const categoryQuery = categoryParam.trim();

        // Try to find category by slug first (MySQL collation is case-insensitive)
        let category = await prisma.category.findFirst({
            where: { slug: categoryQuery },
        });

        // If not found by slug, try to find by name (case-insensitive, partial match)
        if (!category) {
            category = await prisma.category.findFirst({
                where: { name: { contains: categoryQuery } },
            });
        }

        // If category not found, return empty result
        if (!category) {
            const origin = req.headers.get('origin');
            return NextResponse.json({
                success: true,
                posts: [],
                count: 0,
                pagination: {
                    page: 1,
                    limit: limit,
                    total: 0,
                    totalPages: 0,
                    hasMore: false
                },
                message: `No category found matching "${categoryQuery}"`,
            }, {
                status: 200,
                headers: getCorsHeaders(origin)
            });
        }

        const categoryId = category.id;
        const skip = (page - 1) * limit;

        const postWhere = {
            status: "published" as const,
            categories: { some: { id: categoryId } },
        };

        // Get total count for pagination
        const totalCount = await prisma.post.count({ where: postWhere });

        // Find all published posts that have this category, then sort by most
        // recent activity (the later of updatedAt / publishedAt) and paginate
        const matchingPosts = await prisma.post.findMany({
            where: postWhere,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                featuredImage: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                author: { select: { id: true, username: true, email: true } },
            },
        });

        const mostRecentActivity = (p: { updatedAt: Date | null; publishedAt: Date | null }) =>
            Math.max(p.updatedAt?.getTime() ?? 0, p.publishedAt?.getTime() ?? 0);
        matchingPosts.sort((a, b) => mostRecentActivity(b) - mostRecentActivity(a));

        const posts = matchingPosts.slice(skip, skip + limit);

        // Transform the response
        const transformedPosts = posts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || null,
            featuredImage: post.featuredImage || null,
            publishedAt: post.publishedAt || null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.author
                ? {
                    _id: post.author.id,
                    username: post.author.username,
                    email: post.author.email,
                }
                : null,
        }));

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        const origin = req.headers.get('origin');
        return NextResponse.json({
            success: true,
            posts: transformedPosts,
            count: transformedPosts.length,
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
            },
            pagination: {
                page: page,
                limit: limit,
                total: totalCount,
                totalPages: totalPages,
                hasMore: hasMore
            }
        }, {
            status: 200,
            headers: getCorsHeaders(origin)
        });

    } catch (error: any) {
        console.error("Error in filter route:", error);
        const origin = req.headers.get('origin');
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch data",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            {
                status: 500,
                headers: getCorsHeaders(origin)
            }
        );
    }
}
