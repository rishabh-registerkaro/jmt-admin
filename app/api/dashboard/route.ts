import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { hasPermission } from "@/app/lib/utils/authorization";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { JOIN_LEAD_SOURCE } from "@/utils/joinForm";

const ACTIVITY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_PEOPLE = 5;
const MAX_RANKED = 5;

// Days are counted in India time, whatever timezone the server runs in.
const istDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const SITE_PAGES = [
  { key: "about", title: "About us" },
  { key: "contact", title: "Contact" },
  { key: "join-our-crew", title: "Join our crew" },
  { key: "thank-you", title: "Thank you" },
] as const;

type StatusCounts = Record<"new" | "contacted" | "converted" | "lost", number>;

const emptyStatusCounts = (): StatusCounts => ({ new: 0, contacted: 0, converted: 0, lost: 0 });

const sumCounts = (counts: StatusCounts) => Object.values(counts).reduce((sum, n) => sum + n, 0);

/** One answer from a lead's form, or "" when it wasn't filled in. */
function answer(formData: Prisma.JsonValue | null, ...keys: string[]): string {
  if (!formData || typeof formData !== "object" || Array.isArray(formData)) return "";
  for (const key of keys) {
    const value = String(formData[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

/** Largest first; anything past the top few is folded into "Other". */
function ranked(counts: Map<string, number>) {
  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  if (sorted.length <= MAX_RANKED) return sorted;
  const top = sorted.slice(0, MAX_RANKED - 1);
  const rest = sorted.slice(MAX_RANKED - 1).reduce((sum, row) => sum + row.count, 0);
  return [...top, { label: "Other", count: rest }];
}

const personSelect = {
  id: true,
  name: true,
  phoneNo: true,
  leadSource: true,
  status: true,
  formData: true,
  createdAt: true,
} as const;

/**
 * GET /api/dashboard — the signed-in user's overview. Each section is returned
 * only to users allowed to open the page it summarises; the others are null.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (user instanceof NextResponse) return user;

  try {
    const canLeads = hasPermission(user, PERMISSIONS.LEADS_VIEW);
    const canApplications = hasPermission(user, PERMISSIONS.APPLICATIONS_VIEW);
    const canServices = hasPermission(user, PERMISSIONS.SERVICES_MANAGE);
    const canContent = hasPermission(user, PERMISSIONS.CONTENT_EDIT);

    const now = new Date();
    const days = Array.from({ length: ACTIVITY_DAYS }, (_, i) =>
      istDay.format(new Date(now.getTime() - (ACTIVITY_DAYS - 1 - i) * DAY_MS)),
    );
    const activityStart = new Date(`${days[0]}T00:00:00+05:30`);

    const activityWhere: Prisma.LeadWhereInput = { createdAt: { gte: activityStart } };
    if (!canApplications) activityWhere.leadSource = { not: JOIN_LEAD_SOURCE };
    if (!canLeads) activityWhere.leadSource = JOIN_LEAD_SOURCE;

    const [
      leadGroups,
      activityRows,
      recentEnquiries,
      oldestEnquiry,
      recentApplications,
      oldestApplication,
      serviceGroups,
      recentServices,
      homePage,
      sitePages,
    ] = await Promise.all([
      canLeads || canApplications
        ? prisma.lead.groupBy({ by: ["leadSource", "status"], _count: { _all: true } })
        : null,
      canLeads || canApplications
        ? prisma.lead.findMany({
            where: activityWhere,
            select: { createdAt: true, leadSource: true, formData: true },
          })
        : null,
      canLeads
        ? prisma.lead.findMany({
            where: { leadSource: { not: JOIN_LEAD_SOURCE } },
            select: personSelect,
            orderBy: { createdAt: "desc" },
            take: RECENT_PEOPLE,
          })
        : null,
      canLeads
        ? prisma.lead.findFirst({
            where: { status: "new", leadSource: { not: JOIN_LEAD_SOURCE } },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
          })
        : null,
      canApplications
        ? prisma.lead.findMany({
            where: { leadSource: JOIN_LEAD_SOURCE },
            select: personSelect,
            orderBy: { createdAt: "desc" },
            take: RECENT_PEOPLE,
          })
        : null,
      canApplications
        ? prisma.lead.findFirst({
            where: { status: "new", leadSource: JOIN_LEAD_SOURCE },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
          })
        : null,
      canServices ? prisma.jmtServicePage.groupBy({ by: ["status"], _count: { _all: true } }) : null,
      canServices
        ? prisma.jmtServicePage.findMany({
            select: { id: true, slug: true, title: true, status: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 4,
          })
        : null,
      canContent ? prisma.homePage.findFirst({ select: { updatedAt: true } }) : null,
      canContent
        ? prisma.jmtSitePage.findMany({
            where: { key: { in: SITE_PAGES.map((page) => page.key) } },
            select: { key: true, updatedAt: true },
          })
        : null,
    ]);

    // Lead counts by status, and enquiries by the form they came from.
    const enquiryStatus = emptyStatusCounts();
    const applicationStatus = emptyStatusCounts();
    const sources = new Map<string, number>();
    for (const group of leadGroups ?? []) {
      const count = group._count._all;
      if (group.leadSource === JOIN_LEAD_SOURCE) {
        applicationStatus[group.status] += count;
      } else {
        enquiryStatus[group.status] += count;
        sources.set(group.leadSource, (sources.get(group.leadSource) ?? 0) + count);
      }
    }

    // Daily activity, and which trades applied, over the last 30 days.
    const perDay = new Map(days.map((date) => [date, { date, enquiries: 0, applications: 0 }]));
    const trades = new Map<string, number>();
    for (const row of activityRows ?? []) {
      const day = perDay.get(istDay.format(row.createdAt));
      const isApplication = row.leadSource === JOIN_LEAD_SOURCE;
      if (day) day[isApplication ? "applications" : "enquiries"] += 1;
      if (isApplication) {
        const trade = answer(row.formData, "Trade") || "Other";
        trades.set(trade, (trades.get(trade) ?? 0) + 1);
      }
    }

    const servicesCount = (status: "published" | "draft") =>
      serviceGroups?.find((group) => group.status === status)?._count._all ?? 0;

    const sitePageEdits = new Map(sitePages?.map((page) => [page.key, page.updatedAt]));

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: now.toISOString(),
        activity: canLeads || canApplications ? [...perDay.values()] : null,
        enquiries: canLeads
          ? {
              total: sumCounts(enquiryStatus),
              byStatus: enquiryStatus,
              oldestNewAt: oldestEnquiry?.createdAt ?? null,
              sources: ranked(sources),
              recent: (recentEnquiries ?? []).map((lead) => ({
                id: lead.id,
                name: lead.name,
                phoneNo: lead.phoneNo,
                status: lead.status,
                createdAt: lead.createdAt,
                need: answer(lead.formData, "Services requested", "Service") || lead.leadSource,
                location: answer(lead.formData, "Site location"),
                crew: answer(lead.formData, "Headcount", "Crew size"),
              })),
            }
          : null,
        applications: canApplications
          ? {
              total: sumCounts(applicationStatus),
              byStatus: applicationStatus,
              oldestNewAt: oldestApplication?.createdAt ?? null,
              trades: ranked(trades),
              recent: (recentApplications ?? []).map((lead) => ({
                id: lead.id,
                name: lead.name,
                phoneNo: lead.phoneNo,
                status: lead.status,
                createdAt: lead.createdAt,
                trade: answer(lead.formData, "Trade"),
                experience: answer(lead.formData, "Experience"),
                location: answer(lead.formData, "District or town"),
              })),
            }
          : null,
        services: canServices
          ? {
              total: servicesCount("published") + servicesCount("draft"),
              published: servicesCount("published"),
              draft: servicesCount("draft"),
              recent: recentServices ?? [],
            }
          : null,
        pages: canContent
          ? [
              { title: "Homepage", href: "/dashboard/homepage", updatedAt: homePage?.updatedAt ?? null },
              ...SITE_PAGES.map((page) => ({
                title: page.title,
                href: `/dashboard/site-pages/${page.key}`,
                updatedAt: sitePageEdits.get(page.key) ?? null,
              })),
            ]
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error - Fetching dashboard statistics",
        ...(process.env.NODE_ENV === "development" ? { error: error instanceof Error ? error.message : String(error) } : {}),
      },
      { status: 500 },
    );
  }
}
