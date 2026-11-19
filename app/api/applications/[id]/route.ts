import { NextRequest, NextResponse } from "next/server";
import { LeadStatus } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { JOIN_LEAD_SOURCE } from "@/utils/joinForm";
import { applicationsFolder, removeFromFolder } from "@/app/lib/utils/hostingerFtp";
import { readApplicationDocuments } from "@/app/lib/utils/applicationDocuments";

type Ctx = { params: Promise<{ id: string }> };

async function findApplication(id: string) {
  return prisma.lead.findFirst({ where: { id, leadSource: JOIN_LEAD_SOURCE } });
}

/** GET /api/applications/[id] (applications.view) */
export async function GET(req: NextRequest, context: Ctx) {
  const user = await requirePermission(req, PERMISSIONS.APPLICATIONS_VIEW);
  if (user instanceof NextResponse) return user;

  const { id } = await context.params;
  const application = await findApplication(id);
  if (!application) return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
  return NextResponse.json({ success: true, application: withMongoId(application) });
}

/** PUT /api/applications/[id] — change status (applications.manage). Body: { status } */
export async function PUT(req: NextRequest, context: Ctx) {
  const user = await requirePermission(req, PERMISSIONS.APPLICATIONS_MANAGE);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const body = await req.json();
    if (!(Object.values(LeadStatus) as unknown[]).includes(body?.status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }
    if (!(await findApplication(id))) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
    }

    const updated = await prisma.lead.update({ where: { id }, data: { status: body.status as LeadStatus } });
    return NextResponse.json({ success: true, message: "Application updated", application: withMongoId(updated) });
  } catch (error) {
    console.error("Error updating application", error);
    return NextResponse.json({ success: false, message: "Internal Server Error - Updating application" }, { status: 500 });
  }
}

/** DELETE /api/applications/[id] (applications.manage) */
export async function DELETE(req: NextRequest, context: Ctx) {
  const user = await requirePermission(req, PERMISSIONS.APPLICATIONS_MANAGE);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const application = await findApplication(id);
    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 });
    }
    await prisma.lead.delete({ where: { id } });
    // Best-effort: a file already missing on Hostinger must not fail the delete.
    const keys = readApplicationDocuments(application.formData).map((doc) => doc.key);
    await removeFromFolder(applicationsFolder(), keys).catch((error) =>
      console.error("[applications] Failed to remove documents:", error),
    );
    return NextResponse.json({ success: true, message: "Application deleted" });
  } catch (error) {
    console.error("Error deleting application", error);
    return NextResponse.json({ success: false, message: "Internal Server Error - Deleting application" }, { status: 500 });
  }
}
