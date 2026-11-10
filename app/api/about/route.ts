import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

// CORS headers helper
const getCorsHeaders = (origin: string | null) => {
  const PRODUCTION_URL = process.env.PRODUCTION_URL || '';

  // Normalize URLs (remove trailing slashes for comparison)
  const normalizeUrl = (url: string) => url.replace(/\/$/, '');
  const normalizedProductionUrl = normalizeUrl(PRODUCTION_URL);
  const normalizedOrigin = origin ? normalizeUrl(origin) : null;

  if (normalizedOrigin === normalizedProductionUrl) {
    return {
      'Access-Control-Allow-Origin': origin || PRODUCTION_URL,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  if (origin && origin.startsWith('http://localhost:')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  return {
    'Access-Control-Allow-Origin': PRODUCTION_URL,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get('origin')) });
}

// GET — public: the frontend About page fetches this (singleton)
export async function GET(req: NextRequest) {
  try {
    const aboutPage = await prisma.aboutPage.findFirst();
    return NextResponse.json(
      {
        success: true,
        aboutPage: aboutPage ? withMongoId(aboutPage) : null,
      },
      { status: 200, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  } catch (error) {
    console.error("Error fetching about page:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error - Fetching about page" },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  }
}

// POST — create or update the singleton about page (admin dashboard)
export async function POST(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const body = await req.json();
    const { metaTitle, metaDescription, content } = body;

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { success: false, message: "content must be a JSON object" },
        { status: 400, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    const data = {
      metaTitle: metaTitle ?? undefined,
      metaDescription: metaDescription ?? undefined,
      content: content as Prisma.InputJsonValue,
    };

    const existing = await prisma.aboutPage.findFirst();
    const aboutPage = existing
      ? await prisma.aboutPage.update({ where: { id: existing.id }, data })
      : await prisma.aboutPage.create({ data });

    await revalidateFrontendTags(["about-page"]);

    return NextResponse.json(
      {
        success: true,
        message: "About page saved successfully",
        aboutPage: withMongoId(aboutPage),
      },
      { status: 200, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  } catch (error) {
    console.error("Error saving about page:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error - Saving about page" },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  }
}

// PATCH — partial update (kept for API compatibility; same behaviour as POST
// but only touches the provided fields)
export async function PATCH(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const body = await req.json();
    const { metaTitle, metaDescription, content } = body;

    if (content !== undefined && (content === null || typeof content !== "object")) {
      return NextResponse.json(
        { success: false, message: "content must be a JSON object" },
        { status: 400, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    const existing = await prisma.aboutPage.findFirst();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "About page not found — create it first" },
        { status: 404, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    const data: Prisma.AboutPageUpdateInput = {};
    if (metaTitle !== undefined) data.metaTitle = metaTitle;
    if (metaDescription !== undefined) data.metaDescription = metaDescription;
    if (content !== undefined) data.content = content as Prisma.InputJsonValue;

    const aboutPage = await prisma.aboutPage.update({
      where: { id: existing.id },
      data,
    });

    await revalidateFrontendTags(["about-page"]);

    return NextResponse.json(
      {
        success: true,
        message: "About page updated successfully",
        aboutPage: withMongoId(aboutPage),
      },
      { status: 200, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  } catch (error) {
    console.error("Error updating about page:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error - Updating about page" },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  }
}
