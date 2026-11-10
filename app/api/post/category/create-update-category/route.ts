import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import { withMongoId } from "@/app/lib/utils/serialize";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";

// Palette that matches JMT frontend design system
const CATEGORY_PALETTE = [
  "#1e40af", // brand blue  (Engineering-style)
  "#6d28d9", // purple      (Studio-style)
  "#0f766e", // teal
  "#b45309", // amber
  "#be123c", // rose
  "#15803d", // green
  "#c2410c", // orange
  "#7c3aed", // violet
];

function generateCategoryColor(name: string): string {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}


export async function POST(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to create a category.",
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { name, slug, parentCategory, color } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and slug are required fields.",
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    });
    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists. Please use a different slug.",
        },
        { status: 409 }
      );
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await prisma.category.findUnique({ where: { id: parentCategory } });
      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            message: "Parent category not found.",
          },
          { status: 404 }
        );
      }
    }

    // Use provided color or auto-generate from name
    const resolvedColor = (color && color.trim()) ? color.trim() : generateCategoryColor(name.trim());

    // Create the category
    const createdCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.toLowerCase().trim(),
        color: resolvedColor,
        parentId: parentCategory || null,
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully!",
        category: {
          id: createdCategory.id,
          name: createdCategory.name,
          slug: createdCategory.slug,
          color: createdCategory.color,
          parentCategory: createdCategory.parentId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating category:", error);

    // Handle duplicate key error (slug)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to create category.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


// PUT - Update category
export async function PUT(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to update a category.",
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { id, name, slug, parentCategory, color } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required.",
        },
        { status: 400 }
      );
    }

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and slug are required fields.",
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    // Check if slug already exists (excluding current category)
    const normalizedSlug = slug.toLowerCase().trim();
    const existingCategory = await prisma.category.findFirst({
      where: {
        slug: normalizedSlug,
        id: { not: id }, // Exclude current category
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists. Please use a different slug.",
        },
        { status: 409 }
      );
    }

    // Validate parent category if provided
    if (parentCategory) {
      // Prevent setting itself as parent
      if (parentCategory === id) {
        return NextResponse.json(
          {
            success: false,
            message: "A category cannot be its own parent.",
          },
          { status: 400 }
        );
      }

      const parent = await prisma.category.findUnique({ where: { id: parentCategory } });
      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            message: "Parent category not found.",
          },
          { status: 404 }
        );
      }
    }

    // Save the updated category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: normalizedSlug,
        parentId: parentCategory || null,
        // Keep existing color if no new one provided; generate fresh if name changed and no color set
        color: (color && color.trim())
          ? color.trim()
          : (category.color || generateCategoryColor(name.trim())),
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully!",
        category: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          slug: updatedCategory.slug,
          color: updatedCategory.color,
          parentCategory: updatedCategory.parentId,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating category:", error);

    // Handle duplicate key error (slug)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this slug already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update category.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(req: NextRequest) {
  try {
    // Get current user (authorization check)
    const userResult = await requireRole(req, CONTENT_ROLES);


    // Check if getCurrentUser returned an error response (NextResponse)
    if (userResult instanceof NextResponse) {
      return userResult; // Return the unauthorized response
    }

    // Extract user ID from decoded token
    const userId = userResult.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to delete a category.",
        },
        { status: 401 }
      );
    }

    // Get category ID from request body
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required.",
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    // Check if category has children
    const hasChildren = await prisma.category.findFirst({ where: { parentId: id } });
    if (hasChildren) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete category with child categories. Please delete or reassign child categories first.",
        },
        { status: 400 }
      );
    }

    // Check if category is used in any posts
    const postsUsingCategory = await prisma.post.count({
      where: { categories: { some: { id } } },
    });
    if (postsUsingCategory > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category. It is used in ${postsUsingCategory} post(s). Please remove the category from posts first.`,
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({ where: { id } });

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully!",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting category:", error);

    // Handle JWT verification errors
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Invalid or expired token.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to delete category.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET - Fetch single category by ID
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required.",
        },
        { status: 400 }
      );
    }

    // Validate ID format
    if (typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID format.",
        },
        { status: 400 }
      );
    }

    // Fetch the category with its parent category if it exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found.",
        },
        { status: 404 }
      );
    }

    // Map Prisma field names back to the API contract
    const { parent, parentId: _parentId, ...rest } = category;
    const responseCategory = withMongoId({
      ...rest,
      parentCategory: parent ?? null,
    });

    // Return success response with category data
    return NextResponse.json(
      {
        success: true,
        category: responseCategory,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching category:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to fetch category.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
