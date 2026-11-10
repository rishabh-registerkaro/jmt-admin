import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";

function computeReadTimeMinutes(html: string): number {
    const text = html.replace(/<[^>]+>/g, ' ');
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
}

// CORS headers helper
const getCorsHeaders = (origin: string | null) => {
    const PRODUCTION_URL = process.env.PRODUCTION_URL || '';

    // Normalize URLs (remove trailing slashes for comparison)
    const normalizeUrl = (url: string) => url.replace(/\/$/, '');
    const normalizedProductionUrl = normalizeUrl(PRODUCTION_URL);
    const normalizedOrigin = origin ? normalizeUrl(origin) : null;

    // Check if origin matches production URL (with or without trailing slash)
    if (normalizedOrigin === normalizedProductionUrl) {
        return {
            'Access-Control-Allow-Origin': origin || PRODUCTION_URL,
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

    // Default: always allow production URL (for cases where origin might be null or different)
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
        const { searchParams } = new URL(req.url);
        const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
        const skip  = (page - 1) * limit;

        // "Most recent activity" = the later of updatedAt / publishedAt.
        // Fetch the ordered page of ids via raw SQL, then hydrate with relations.
        const [orderedIdRows, totalCount] = await Promise.all([
            prisma.$queryRaw<Array<{ id: string }>>`
                SELECT id FROM posts
                WHERE status = 'published'
                ORDER BY GREATEST(COALESCE(updatedAt,'1970-01-01'), COALESCE(publishedAt,'1970-01-01')) DESC
                LIMIT ${limit} OFFSET ${skip}`,
            prisma.post.count({ where: { status: "published" } }),
        ]);

        const orderedIds = orderedIdRows.map((row) => row.id);
        const unorderedPosts = await prisma.post.findMany({
            where: { id: { in: orderedIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                featuredImage: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                excerpt: true,
                content: true,
                author: { select: { id: true, username: true } },
                categories: { select: { id: true, name: true, slug: true, color: true } },
            },
        });
        const postsById = new Map(unorderedPosts.map((p) => [p.id, p]));
        const posts = orderedIds
            .map((id) => postsById.get(id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));

        const totalPages = Math.ceil(totalCount / limit);
        const transformedPosts = posts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            featuredImage: post.featuredImage || null,
            publishedAt: post.publishedAt || null,
            excerpt: post.excerpt || null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            readTimeMinutes: computeReadTimeMinutes(post.content || ""),
            author: post.author ? { id: post.author.id, username: post.author.username } : null,
            category: Array.isArray(post.categories)
                ? post.categories.map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug, color: cat.color || "" }))
                : [],
        }));

        const origin = req.headers.get("origin");
        return NextResponse.json(
            {
                success: true,
                posts: transformedPosts,
                count: transformedPosts.length,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            },
            { status: 200, headers: getCorsHeaders(origin) }
        );
    } catch (error: any) {
        console.error("Error fetching top blogs:", error);
        const origin = req.headers.get("origin");
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch blogs",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500, headers: getCorsHeaders(origin) }
        );
    }
}
