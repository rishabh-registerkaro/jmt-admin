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
        // Sitemap is public — only published pages may appear here.
        // (The dashboard listing uses /api/services and still shows drafts.)
        const services = await prisma.servicePage.findMany({
            where: { status: "published" },
            select: { id: true, slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
        });

        const data = services.map((s) => ({
            id: s.id,
            slug: s.slug,
            updatedAt: s.updatedAt,
        }));

        const origin = req.headers.get('origin');
        return NextResponse.json(
            { success: true, services: data },
            { status: 200, headers: getCorsHeaders(origin) }
        );
    } catch (error: any) {
        const origin = req.headers.get('origin');
        return NextResponse.json(
            { success: false, message: "Failed to fetch service slugs" },
            { status: 500, headers: getCorsHeaders(origin) }
        );
    }
}
