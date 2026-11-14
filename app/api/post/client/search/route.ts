import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import { errorFields } from "@/app/lib/utils/errorFields";

const getCorsHeaders = (origin: string | null) => {
    const PRODUCTION_URL = process.env.PRODUCTION_URL || '';
    // Check if origin is production URL
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
        // get search query parameter
        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get("q") || "";

        // validate search query
        if (!searchQuery || searchQuery.trim().length === 0) {
            const origin = req.headers.get('origin');
            return NextResponse.json({
                success: false,
                message: "Search Query is required",
            }, {
                status: 400,
                headers: getCorsHeaders(origin)
            })
        }

        // Match only published posts, search by title (case-insensitive, partial
        // match) and sort by most recent activity (updatedAt or publishedAt)
        const posts = await prisma.$queryRaw<Array<{ title: string; slug: string }>>`
            SELECT title, slug FROM posts
            WHERE status = 'published' AND title LIKE ${"%" + searchQuery.trim() + "%"}
            ORDER BY GREATEST(COALESCE(updatedAt,'1970-01-01'), COALESCE(publishedAt,'1970-01-01')) DESC
            LIMIT 10`;

        // Return original format with success and posts
        const origin = req.headers.get('origin');
        return NextResponse.json({
            success: true,
            posts: posts
        }, {
            status: 200,
            headers: getCorsHeaders(origin)
        })
    } catch (error) {
        console.error("Error searching blogs:", error);
        const origin = req.headers.get('origin');
        return NextResponse.json(
            {
                success: false,
                message: "Failed to search blogs",
                error: process.env.NODE_ENV === "development" ? errorFields(error).message : undefined,
            },
            {
                status: 500,
                headers: getCorsHeaders(origin)
            }
        );
    }
}
