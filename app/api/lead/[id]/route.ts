import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const userResult = await getCurrentUser(req);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login to access leads." },
        { status: 401 }
      );
    }

    const existingLead = await prisma.lead.findUnique({ where: { id } });

    if (!existingLead) {
      return NextResponse.json(
        {
          message: "Lead Not found corresponding to this id",
        },
        {
          status: 404,
        }
      );
    }

    const deleteLead = await prisma.lead.delete({ where: { id } });

    return NextResponse.json(
      { message: "Lead Deleted Successfully", deletedLead: withMongoId(deleteLead) },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting lead", error);
    return NextResponse.json(
      { message: "Internal Server Error-deleting lead" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const userResult = await getCurrentUser(req);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login to access leads." },
        { status: 401 }
      );
    }
    const body = await req.json();

    // Only known Lead fields — Mongoose silently ignored unknown keys,
    // Prisma would throw on them.
    const ALLOWED_FIELDS = [
      "name",
      "email",
      "phoneNo",
      "status",
      "leadSource",
      "formData",
    ] as const;

    const data: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const existingLead = await prisma.lead.findUnique({ where: { id } });

    if (!existingLead) {
      return NextResponse.json(
        { message: "Lead corresponding to this id not found" },
        { status: 404 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json(
      { message: "Updated Lead data", updatedLead: withMongoId(updatedLead) },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error updating lead", error);
    return NextResponse.json(
      { message: "Internal Server Error-Updating Lead data" },
      { status: 500 }
    );
  }
}
