import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";

const getCorsHeaders = (origin: string | null) => {
    const PRODUCTION_URL = process.env.PRODUCTION_URL || "";
    const normalize = (url: string) => url.replace(/\/$/, "");
    if (normalize(origin ?? "") === normalize(PRODUCTION_URL)) {
        return {
            "Access-Control-Allow-Origin": origin || PRODUCTION_URL,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };
    }
    if (origin && origin.startsWith("http://localhost:")) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };
    }
    return {
        "Access-Control-Allow-Origin": PRODUCTION_URL,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
};

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get("origin")) });
}

// Lightweight endpoint — returns all published posts with only the fields
// needed for sidebar navigation and prev/next links. No content field.
export async function GET(req: NextRequest) {
    try {
        const rows = await prisma.post.findMany({
            where: { status: "published" },
            select: {
                slug: true,
                title: true,
                publishedAt: true,
                updatedAt: true,
                categories: { select: { name: true, slug: true, color: true } },
            },
        });

        // Sort by most recent activity (the later of updatedAt / publishedAt)
        const mostRecentActivity = (p: { updatedAt: Date | null; publishedAt: Date | null }) =>
            Math.max(p.updatedAt?.getTime() ?? 0, p.publishedAt?.getTime() ?? 0);
        rows.sort((a, b) => mostRecentActivity(b) - mostRecentActivity(a));

        const posts = rows.map((post) => ({
            slug: post.slug,
            title: post.title,
            publishedAt: post.publishedAt,
            category: post.categories.map((cat) => ({
                name: cat.name,
                slug: cat.slug,
                color: cat.color,
            })),
        }));

        const origin = req.headers.get("origin");
        return NextResponse.json(
            { success: true, posts, count: posts.length },
            { status: 200, headers: getCorsHeaders(origin) }
        );
    } catch (error: any) {
        console.error("GET /api/post/client/blog-meta error:", error);
        const origin = req.headers.get("origin");
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch blog meta",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500, headers: getCorsHeaders(origin) }
        );
    }
}
