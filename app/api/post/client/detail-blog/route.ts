import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";



// CORS headers helper - REPLACE THE HARDCODED ONE
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
    return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function GET(req: NextRequest) {
    try {
        // Get slug from query parameters
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        // Validate slug parameter
        if (!slug || slug.trim().length === 0) {
            return NextResponse.json({
                success: false,
                message: "Slug parameter is required",
            }, {
                status: 400,
                headers: getCorsHeaders(req.headers.get('origin'))
            });
        }

        // Fetch post by slug and status with author + categories
        const post = await prisma.post.findFirst({
            where: {
                slug: slug.trim().toLowerCase(),
                status: "published",
            },
            include: {
                author: { select: { id: true, username: true } },
                categories: { select: { id: true, name: true, slug: true, color: true } },
            },
        });

        // Check if post was found
        if (!post) {
            return NextResponse.json({
                success: false,
                message: "Post not found or not published",
            }, {
                status: 404,
                headers: getCorsHeaders(req.headers.get('origin'))
            });
        }

        // Transform the response to include all post data
        const transformedPost = {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || null,
            content: post.content,
            featuredImage: post.featuredImage || null,
            status: post.status,
            publishedAt: post.publishedAt || null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.author ? {
                id: post.author.id,
                username: post.author.username,
            } : null,
            category: Array.isArray(post.categories)
                ? post.categories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    color: cat.color || "",
                }))
                : [],
            faq_items: post.faqItems || [],
            additionalFields: post.additionalFields || {},
            schema: post.schemaJson || null,
        };

        return NextResponse.json({
            success: true,
            post: transformedPost,
        }, {
            status: 200,
            headers: getCorsHeaders(req.headers.get('origin'))
        });

    } catch (error: any) {
        console.error("Error fetching blog detail:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch blog post",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            {
                status: 500,
                headers: getCorsHeaders(req.headers.get('origin'))
            }
        );
    }
}
