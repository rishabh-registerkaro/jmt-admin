import prisma from "@/app/lib/config/db";
import { withMongoId } from "@/app/lib/utils/serialize";
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, PublishStatus } from "@prisma/client";
import { revalidateFrontendTags, serviceTags } from "@/app/lib/utils/revalidateFrontend";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const userResult = await getCurrentUser(req);
        if (userResult instanceof NextResponse) {
          return userResult;
        }
        const userId = userResult.id;
        if (!userId) {
          return NextResponse.json(
            { message: "Unauthorized. Please login to access service data." },
            { status: 401}
          );
        }
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json(
        { message: "Slug is required" },
        { status: 400 }
      );
    }

    const service = await prisma.servicePage.findUnique({ where: { slug } });
    if (!service) {
      return NextResponse.json(
        { message: "Service Not Found" },
        { status: 404 }
      );
    }
    const { authorId, ...rest } = service;
    return NextResponse.json(
      {
        message: "Service Data fetched successfully",
        data: withMongoId({ ...rest, author: authorId }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching service data", error);
    return NextResponse.json(
      { message: "Internal Server Error-fetching service data", error: error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
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
    const { slug: newSlug, ...rest } = await req.json();

    if (newSlug && newSlug !== slug) {
      const existing = await prisma.servicePage.findUnique({
        where: { slug: newSlug },
      });
      if (existing) {
        return NextResponse.json(
          { message: `Slug "${newSlug}" is already taken. Please choose a different slug.` },
          { status: 409 }
        );
      }
    }

    const existingPage = await prisma.servicePage.findUnique({ where: { slug } });
    if (!existingPage) {
      return NextResponse.json(
        { message: "Service Page not found" },
        { status: 404 }
      );
    }

    const data: Prisma.ServicePageUpdateInput = {};
    if (newSlug) data.slug = newSlug;
    if (rest.template !== undefined) data.template = rest.template;
    if (rest.metaTitle !== undefined) data.metaTitle = rest.metaTitle;
    if (rest.metaDescription !== undefined) data.metaDescription = rest.metaDescription;
    if (rest.content !== undefined) {
      if (!rest.content || typeof rest.content !== "object") {
        return NextResponse.json(
          { message: "content must be a JSON object" },
          { status: 400 }
        );
      }
      data.content = rest.content as Prisma.InputJsonValue;
    }
    if (rest.status !== undefined) data.status = rest.status as PublishStatus;

    const updated = await prisma.servicePage.update({
      where: { slug },
      data,
    });

    // Clear both the old and (possibly renamed) new slug on the frontend
    const tags = new Set([...serviceTags(slug), ...serviceTags(updated.slug)]);
    await revalidateFrontendTags([...tags]);

    const { authorId: updatedAuthorId, ...updatedRest } = updated;
    return NextResponse.json(
      { message: "Service Page updated successfully", updatedPage: withMongoId({ ...updatedRest, author: updatedAuthorId }) },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error while editing service page");
    return NextResponse.json(
      { message: "Internal Server error-Editing service Page",
        error:error
       },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
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
    const existingPage = await prisma.servicePage.findUnique({ where: { slug } });

    if (!existingPage) {
      return NextResponse.json(
        { message: "Service Page not found" },
        { status: 404 }
      );
    }

    const deleted = await prisma.servicePage.delete({ where: { slug } });

    // Remove the page from the live site immediately
    await revalidateFrontendTags(serviceTags(slug));

    const { authorId, ...rest } = deleted;

    return NextResponse.json(
      { message: "Service Page deleted successfully", deletePage: withMongoId({ ...rest, author: authorId }) },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting service page", error);
    return NextResponse.json(
      { message: "Internal Server Error — deleting service page failed" },
      { status: 500 }
    );
  }
}
