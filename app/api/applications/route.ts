import { NextRequest, NextResponse } from "next/server";
import { LeadStatus, Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { intParam } from "@/app/lib/utils/pagination";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { JOIN_LEAD_SOURCE, JOIN_OTHER } from "@/utils/joinForm";

/**
 * GET /api/applications — Join Our Crew worker applications (applications.view).
 * They are stored as leads with leadSource = JOIN_LEAD_SOURCE (see
 * app/api/lead/join/route.ts); /api/lead excludes them.
 *
 * Query: page, limit, status, trade, search (name or phone)
 */
export async function GET(req: NextRequest) {
  const user = await requirePermission(req, PERMISSIONS.APPLICATIONS_VIEW);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, intParam(searchParams.get("page"), 1));
    const limit = Math.min(100, Math.max(1, intParam(searchParams.get("limit"), 10)));
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const trade = searchParams.get("trade")?.trim();
    const search = searchParams.get("search")?.trim().slice(0, 100);
    const noMatch = !!status && !(Object.values(LeadStatus) as string[]).includes(status);

    const where: Prisma.LeadWhereInput = { leadSource: JOIN_LEAD_SOURCE };
    if (status && !noMatch) where.status = status as LeadStatus;
    // "Other" is saved with what the applicant typed ("Other: Painter").
    if (trade) {
      where.formData =
        trade === JOIN_OTHER
          ? { path: "$.Trade", string_starts_with: JOIN_OTHER }
          : { path: "$.Trade", equals: trade };
    }
    if (search) where.OR = [{ name: { contains: search } }, { phoneNo: { contains: search } }];

    const [total, applications, statusGroups] = noMatch
      ? [0, [], []]
      : await Promise.all([
          prisma.lead.count({ where }),
          prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
          prisma.lead.groupBy({
            by: ["status"],
            where: { leadSource: JOIN_LEAD_SOURCE },
            _count: { _all: true },
          }),
        ]);

    const statusCounts = Object.fromEntries(
      (Object.values(LeadStatus) as string[]).map((s) => [
        s,
        statusGroups.find((g) => g.status === s)?._count._all ?? 0,
      ]),
    );

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      success: true,
      applications: applications.map((a) => withMongoId(a)),
      statusCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching applications", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error - Fetching applications" },
      { status: 500 },
    );
  }
}
