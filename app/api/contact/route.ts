import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";
import { NextResponse, NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const getCorsHeaders = (origin: string | null) => {
    const PRODUCTION_URL = process.env.PRODUCTION_URL || "";
    const normalize = (u: string) => u.replace(/\/$/, "");

    if (origin && normalize(origin) === normalize(PRODUCTION_URL)) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };
    }
    if (origin && origin.startsWith("http://localhost:")) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };
    }
    return {
        "Access-Control-Allow-Origin": PRODUCTION_URL,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
};

// Nullable Json columns need Prisma.JsonNull instead of plain null
const jsonValue = (v: unknown) =>
    v === null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get("origin")) });
}

// Public — frontend fetches this
export async function GET(req: NextRequest) {
    try {
        const doc = await prisma.contactPage.findFirst();
        const corsHeaders = getCorsHeaders(req.headers.get("origin"));

        if (!doc) {
            return NextResponse.json({ success: true, data: null }, { headers: corsHeaders });
        }

        return NextResponse.json(
            { success: true, data: { metaTitle: doc.metaTitle, metaDescription: doc.metaDescription, content: doc.content } },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("GET /api/contact error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch contact page." }, { status: 500 });
    }
}

// Create — only if no document exists yet
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireRole(req, CONTENT_ROLES);
        if (authResult instanceof NextResponse) return authResult;

        const existing = await prisma.contactPage.findFirst();
        if (existing) {
            return NextResponse.json(
                { success: false, message: "Contact page already exists. Use PATCH to update." },
                { status: 409 }
            );
        }

        const body = await req.json()
        const doc = await prisma.contactPage.create({
            data: {
                metaTitle: body.metaTitle,
                metaDescription: body.metaDescription,
                content: (body.content ?? {}) as Prisma.InputJsonValue,
            },
        });

        await revalidateFrontendTags(["contact-page"]);

        return NextResponse.json({ success: true, data: withMongoId(doc) }, { status: 201 });
    } catch (error) {
        console.error("POST /api/contact error:", error);
        return NextResponse.json({ success: false, message: "Failed to create contact page." }, { status: 500 });
    }
}

// Update — deep-merges content field
export async function PATCH(req: NextRequest) {
    try {
        const authResult = await requireRole(req, CONTENT_ROLES);
        if (authResult instanceof NextResponse) return authResult;

        const body = await req.json();

        const doc = await prisma.contactPage.findFirst();
        if (!doc) {
            return NextResponse.json(
                { success: false, message: "Contact page not found. Use POST to create it first." },
                { status: 404 }
            );
        }

        const data: Prisma.ContactPageUpdateInput = {};
        if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle;
        if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription;
        if (body.content !== undefined) {
            // Replace the entire content object (CMS always sends the full shape)
            data.content = jsonValue(body.content);
        }

        const updated = await prisma.contactPage.update({
            where: { id: doc.id },
            data,
        });

        await revalidateFrontendTags(["contact-page"]);

        return NextResponse.json({ success: true, data: { metaTitle: updated.metaTitle, metaDescription: updated.metaDescription, content: updated.content } });
    } catch (error) {
        console.error("PATCH /api/contact error:", error);
        return NextResponse.json({ success: false, message: "Failed to update contact page." }, { status: 500 });
    }
}
