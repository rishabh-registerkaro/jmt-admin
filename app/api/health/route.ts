import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";

export async function GET(req: NextRequest) {
    const start = Date.now();

    let dbStatus: "connected" | "disconnected" | "error" = "disconnected";
    let dbError: string | null = null;

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = "connected";
    } catch (err: any) {
        dbStatus = "error";
        dbError = err.message || "Unknown DB error";
    }

    const healthy = dbStatus === "connected";
    const domain = process.env.PRODUCTION_URL || req.headers.get("host") || "unknown";

    return NextResponse.json(
        {
            success: healthy,
            message: healthy ? "All systems operational" : "Degraded — database unreachable",
            domain,
            db: {
                status: dbStatus,
                ...(dbError ? { error: dbError } : {}),
            },
            responseTimeMs: Date.now() - start,
            timestamp: new Date().toISOString(),
        },
        { status: healthy ? 200 : 503 }
    );
}
