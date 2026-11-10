import prisma from "@/app/lib/config/db";
import { Prisma } from "@prisma/client";
import { sendLeadNotification } from "@/app/lib/config/email";
import { withMongoId } from "@/app/lib/utils/serialize";
import { getCorsHeaders } from "@/app/lib/utils/corsHeader";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(req) });
}

// POST - Create Lead (Step 1)
// ── Validation (mirrors the frontend rules in JMT/app/lib/leads.ts) ──

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns an error message, or null when the common fields are valid. */
function validateLead(name: unknown, email: unknown, phone: unknown): string | null {
  if (typeof name !== "string" || name.trim().length < 2) {
    return "Please enter your full name (at least 2 characters).";
  }
  if (name.trim().length > 100) return "Name is too long (max 100 characters).";

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.trim().length > 254) {
    return "Please enter a valid email address.";
  }

  if (typeof phone !== "string") return "Please enter your phone number.";
  const digits = phone.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d{7,15}$/.test(digits)) {
    return "Please enter a valid phone number (7–15 digits).";
  }
  return null;
}

/** Trim values, drop empties, and cap sizes so only real data reaches the DB. */
function sanitizeFormData(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 20)) {
    const k = String(key).trim().slice(0, 100);
    const v = String(value ?? "").trim().slice(0, 2000);
    if (k && v) clean[k] = v;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const body = await req.json();

    // Common fields shared by every website form; everything form-specific
    // arrives in body.formData as {"Field Label": value} pairs.
    const validationError = validateLead(body.name, body.email, body.phoneNo);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.formData !== undefined && (body.formData === null || typeof body.formData !== "object")) {
      return NextResponse.json(
        { success: false, message: "formData must be an object" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Every submission is its own lead — the same person submitting from a
    // different page (or twice) must never overwrite an earlier lead.
    const lead = await prisma.lead.create({
      data: {
        name: String(body.name).trim(),
        email: String(body.email).trim().toLowerCase(),
        phoneNo: String(body.phoneNo).trim(),
        leadSource: (typeof body.leadSource === "string" && body.leadSource.trim()
          ? body.leadSource.trim().slice(0, 200)
          : "Website"),
        formData: sanitizeFormData(body.formData) as Prisma.InputJsonValue | undefined,
        status: "new",
      },
    });

    // Notify the admin. Awaited (with a cap) so serverless hosts don't cut it
    // off mid-send, but a slow/failed email never delays or fails the visitor.
    await Promise.race([
      sendLeadNotification({
        name: lead.name,
        email: lead.email,
        phoneNo: lead.phoneNo,
        leadSource: lead.leadSource,
        formData: lead.formData as Record<string, string> | null,
        createdAt: lead.createdAt,
      }),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        leadId: lead.id,
        data: withMongoId(lead),
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.log("Error while storing lead data in DB", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Storing Lead data",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// GET - Fetch Leads (Admin Only)
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const userResult = await requireRole(req, ADMIN_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult; // Unauthorized response
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login to access leads." },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters — an invalid status value would make Prisma throw on
    // the enum, so treat it as matching nothing instead.
    const status = searchParams.get("status");
    const LEAD_STATUSES = ["new", "contacted", "converted", "lost"];
    const noMatch = status !== null && !LEAD_STATUSES.includes(status);

    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const total = noMatch ? 0 : await prisma.lead.count({ where: query });

    // Fetch leads with pagination
    const leads = noMatch
      ? []
      : await prisma.lead.findMany({
          where: query,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });

    const serializedLeads = leads.map((lead) => withMongoId(lead));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json(
      {
        success: true,
        message: "Fetched Leads Data successfully",
        leadCount: total,
        leads: serializedLeads,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          limit,
          hasNextPage,
          hasPrevPage,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.log("Error fetching leads", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Fetching leads",
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
