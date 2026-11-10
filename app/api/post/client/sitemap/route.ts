import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";

const getCorsHeaders = (origin: string | null) => {
    const PRODUCTION_URL = process.env.PRODUCTION_URL || '';
    const allowed = [PRODUCTION_URL].filter(Boolean);
    const isAllowed = origin && (allowed.includes(origin) || origin.startsWith('http://localhost:'));
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : (PRODUCTION_URL || '*'),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
};

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function GET(req: NextRequest) {
    try {
        const posts = await prisma.post.findMany({
            where: { status: "published" },
            select: { id: true, slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
        });

        const data = posts.map((p) => ({
            id: p.id,
            slug: p.slug,
            updatedAt: p.updatedAt,
        }));

        const origin = req.headers.get('origin');
        return NextResponse.json(
            { success: true, posts: data },
            { status: 200, headers: getCorsHeaders(origin) }
        );
    } catch (error: any) {
        const origin = req.headers.get('origin');
        return NextResponse.json(
            { success: false, message: "Failed to fetch post slugs" },
            { status: 500, headers: getCorsHeaders(origin) }
        );
    }
}
