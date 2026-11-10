import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { Prisma, FooterMenu } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

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
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
      };
  }

  // Check if origin is localhost with any port
  if (origin && origin.startsWith('http://localhost:')) {
      return {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
      };
  }

  // Default: always allow production URL (for cases where origin might be null or different)
  return {
      'Access-Control-Allow-Origin': PRODUCTION_URL,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
  };
};

// API contract keeps the Mongo-era snake_case field names `main_menu` and
// `contact_details` (Prisma fields are `mainMenu` / `contactDetails`).
const serializeFooterMenu = (menu: FooterMenu) => {
  const { mainMenu, contactDetails, ...rest } = menu;
  return withMongoId({
    ...rest,
    main_menu: mainMenu,
    contact_details: contactDetails,
  });
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get('origin')) });
}

// GET - Fetch footer menu (singleton - only one document)
export async function GET(req: NextRequest) {
  try {
    // Get the footer menu (there should only be one)
    let footerMenu = await prisma.footerMenu.findFirst();

    // If no menu exists, create an empty one
    if (!footerMenu) {
      footerMenu = await prisma.footerMenu.create({
        data: {
          mainMenu: [] as Prisma.InputJsonValue,
          contactDetails: [] as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        footerMenu: serializeFooterMenu(footerMenu),
      },
      { status: 200, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  } catch (error) {
    console.error("Error fetching footer menu:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Fetching footer menu",
        error: error,
      },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  }
}

// POST/PUT - Create or update footer menu (singleton pattern)
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const body = await req.json();
    const { main_menu, contact_details } = body;

    // Validate main_menu structure (optional, can be undefined)
    if (main_menu !== undefined && !Array.isArray(main_menu)) {
      return NextResponse.json(
        {
          success: false,
          message: "main_menu must be an array",
        },
        { status: 400, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    // Validate contact_details structure (optional, can be undefined)
    if (contact_details !== undefined && !Array.isArray(contact_details)) {
      return NextResponse.json(
        {
          success: false,
          message: "contact_details must be an array",
        },
        { status: 400, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    // Check if footer menu already exists
    let footerMenu = await prisma.footerMenu.findFirst();

    if (footerMenu) {
      // Update existing
      const updateData: Prisma.FooterMenuUpdateInput = {};
      if (main_menu !== undefined) updateData.mainMenu = main_menu as Prisma.InputJsonValue;
      if (contact_details !== undefined) updateData.contactDetails = contact_details as Prisma.InputJsonValue;

      footerMenu = await prisma.footerMenu.update({
        where: { id: footerMenu.id },
        data: updateData,
      });

      await revalidateFrontendTags(["footer-menu"]);

      return NextResponse.json(
        {
          success: true,
          message: "Footer menu updated successfully",
          footerMenu: serializeFooterMenu(footerMenu),
        },
        { status: 200, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    } else {
      // Create new - direct assignment
      footerMenu = await prisma.footerMenu.create({
        data: {
          mainMenu: (main_menu !== undefined ? main_menu : []) as Prisma.InputJsonValue,
          contactDetails: (contact_details !== undefined ? contact_details : []) as Prisma.InputJsonValue,
        },
      });

      await revalidateFrontendTags(["footer-menu"]);

      return NextResponse.json(
        {
          success: true,
          message: "Footer menu created successfully",
          footerMenu: serializeFooterMenu(footerMenu),
        },
        { status: 201, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }
  } catch (error) {
    console.error("Error saving footer menu:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Saving footer menu",
        error: error,
      },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  }
}

// PUT - Update footer menu
export async function PUT(req: NextRequest) {
  try {
    // Authenticate user
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }

    const body = await req.json();
    const { main_menu, contact_details } = body;

    // Validate main_menu structure (optional, can be undefined)
    if (main_menu !== undefined && !Array.isArray(main_menu)) {
      return NextResponse.json(
        {
          success: false,
          message: "main_menu must be an array",
        },
        { status: 400, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    // Validate contact_details structure (optional, can be undefined)
    if (contact_details !== undefined && !Array.isArray(contact_details)) {
      return NextResponse.json(
        {
          success: false,
          message: "contact_details must be an array",
        },
        { status: 400, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    // Find and update footer menu
    let footerMenu = await prisma.footerMenu.findFirst();

    if (!footerMenu) {
      // Create if doesn't exist
      footerMenu = await prisma.footerMenu.create({
        data: {
          mainMenu: (main_menu !== undefined ? main_menu : []) as Prisma.InputJsonValue,
          contactDetails: (contact_details !== undefined ? contact_details : []) as Prisma.InputJsonValue,
        },
      });

      await revalidateFrontendTags(["footer-menu"]);

      return NextResponse.json(
        {
          success: true,
          message: "Footer menu created successfully",
          footerMenu: serializeFooterMenu(footerMenu),
        },
        { status: 201, headers: getCorsHeaders(req.headers.get('origin')) }
      );
    }

    // Update existing
    const updateData: Prisma.FooterMenuUpdateInput = {};
    if (main_menu !== undefined) updateData.mainMenu = main_menu as Prisma.InputJsonValue;
    if (contact_details !== undefined) updateData.contactDetails = contact_details as Prisma.InputJsonValue;

    footerMenu = await prisma.footerMenu.update({
      where: { id: footerMenu.id },
      data: updateData,
    });

    await revalidateFrontendTags(["footer-menu"]);

    return NextResponse.json(
      {
        success: true,
        message: "Footer menu updated successfully",
        footerMenu: serializeFooterMenu(footerMenu),
      },
      { status: 200, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  } catch (error) {
    console.error("Error updating footer menu:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Updating footer menu",
        error: error,
      },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    );
  }
}
