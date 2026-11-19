import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { applicationsFolder, downloadFromFolder } from "@/app/lib/utils/hostingerFtp";
import { readApplicationDocuments } from "@/app/lib/utils/applicationDocuments";
import { JOIN_LEAD_SOURCE } from "@/utils/joinForm";

type Ctx = { params: Promise<{ id: string; key: string }> };

/**
 * GET /api/applications/[id]/documents/[key] (applications.view)
 *
 * Streams one CV / letter from the private applications folder. Only a key
 * listed on that application is fetched, so the URL can't be used to read
 * any other file on the server.
 */
export async function GET(req: NextRequest, context: Ctx) {
  const user = await requirePermission(req, PERMISSIONS.APPLICATIONS_VIEW);
  if (user instanceof NextResponse) return user;

  const { id, key } = await context.params;
  const application = await prisma.lead.findFirst({ where: { id, leadSource: JOIN_LEAD_SOURCE } });
  const doc = readApplicationDocuments(application?.formData).find((d) => d.key === key);
  if (!doc) return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });

  try {
    const file = await downloadFromFolder(applicationsFolder(), doc.key);
    // PDFs and images open in the browser; Word files download.
    const inline = doc.type === "application/pdf" || doc.type.startsWith("image/");
    const asciiName = doc.name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": doc.type,
        "Content-Length": String(file.length),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[applications] Failed to read document:", error);
    return NextResponse.json({ success: false, message: "Could not load the document" }, { status: 502 });
  }
}
