import prisma from "@/app/lib/config/db";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { withMongoId } from "@/app/lib/utils/serialize";
import { ensureDefaultCategory } from "@/app/lib/utils/DefaultCategory";

import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES, EDITOR_ROLES } from "@/app/lib/constants/role";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

// Frontend cache tags for a blog post (mirrors app/lib/cms.ts on the frontend)
const postTags = (slug: string) => ["post-list", `post-${slug}`];


export async function POST(req: NextRequest) {
  try {
    // Get current user (for authentication and fallback author)
    const authorResult = await requireRole(req, EDITOR_ROLES);
    if (authorResult instanceof NextResponse) {
      return authorResult;
    }
    const authenticatedUserId = authorResult.id;

    if (!authenticatedUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to create a post."
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      status,
      publishedAt,
      faq_items,
      additionalFields,
      schema, // JSON-LD schema with @context and @graph
      author, // Author from request body (optional)
    } = body;

    // Use provided author if available, otherwise use authenticated user's ID
    let authorId = authenticatedUserId;

    if (author && author.trim()) {
      // Validate author ID format
      if (typeof author !== "string" || author.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid author ID format.",
          },
          { status: 400 }
        );
      }
      authorId = author.trim();
    }

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, slug, and content are required fields.",
        },
        { status: 400 }
      );
    }

    // Validate status enum (Mongoose used to reject this as a ValidationError)
    if (status !== undefined && status !== null && !["draft", "published"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: [`\`${status}\` is not a valid enum value for path \`status\`.`],
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({ where: { slug } });
    if (existingPost) {
      return NextResponse.json(
        {
          success: false,
          message: "A post with this slug already exists. Please use a different slug.",
        },
        { status: 409 }
      );
    }

    // Validate FAQ items if provided
    if (faq_items && Array.isArray(faq_items)) {
      for (const faq of faq_items) {
        if (!faq.question || !faq.answer) {
          return NextResponse.json(
            {
              success: false,
              message: "Each FAQ item must have both question and answer.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare post data
    const postData: Prisma.PostUncheckedCreateInput = {
      title: title.trim(),
      slug: slug.toLowerCase().trim(),
      content: content.trim(),
      authorId: authorId,
      status: status || "draft",
    };

    // Add optional fields
    if (excerpt) postData.excerpt = excerpt.trim();
    if (featuredImage) postData.featuredImage = featuredImage.trim();

    // Handle category - assign to "Others" if no category is selected
    let categoryIds: string[] = [];
    if (category) {
      // Handle category array and validate
      const categoryArray = Array.isArray(category) ? category : [category];
      const validCategoryIds = categoryArray.filter(Boolean);

      // Validate all category IDs exist
      if (validCategoryIds.length > 0) {
        // Verify all categories exist in database
        const existingCategories = await prisma.category.findMany({
          where: { id: { in: validCategoryIds } },
          select: { id: true },
        });

        const existingIds = existingCategories.map((cat) => cat.id);
        const invalidIds = validCategoryIds.filter((id: string) => !existingIds.includes(id));

        if (invalidIds.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid category IDs: ${invalidIds.join(', ')}`,
            },
            { status: 400 }
          );
        }

        categoryIds = validCategoryIds;
      } else {
        // Empty array provided, assign to "Others"
        const othersCategoryId = await ensureDefaultCategory();
        categoryIds = [othersCategoryId];
      }
    } else {
      // No category provided, assign to "Others"
      const othersCategoryId = await ensureDefaultCategory();
      categoryIds = [othersCategoryId];
    }
    postData.categories = { connect: categoryIds.map((id) => ({ id })) };

    // Add FAQ items if provided
    if (faq_items && Array.isArray(faq_items) && faq_items.length > 0) {
      postData.faqItems = faq_items.map((faq: any) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      })) as Prisma.InputJsonValue;
    }

    // Add additional fields (ACF-style custom fields)
    if (additionalFields && typeof additionalFields === "object") {
      postData.additionalFields = additionalFields as Prisma.InputJsonValue;
    }

    // Add schema (Array of schema objects)
    if (schema !== undefined) {
      if (schema === null) {
        postData.schemaJson = Prisma.DbNull;
      } else if (Array.isArray(schema)) {
        // Filter out any null/undefined values and ensure all items are objects
        postData.schemaJson = schema.filter((s: any) => s !== null && s !== undefined && typeof s === "object") as Prisma.InputJsonValue;
      } else if (typeof schema === "object") {
        // If it's a single object, wrap it in an array
        postData.schemaJson = [schema] as Prisma.InputJsonValue;
      } else {
        postData.schemaJson = Prisma.DbNull;
      }
    } else {
      postData.schemaJson = Prisma.DbNull;
    }

    // Handle publishedAt
    if (status === "published") {
      if (publishedAt) {
        postData.publishedAt = new Date(publishedAt);
      } else {
        postData.publishedAt = new Date();
      }
    } else {
      postData.publishedAt = null;
    }

    // Create the post
    const createdPost = await prisma.post.create({ data: postData });

    await revalidateFrontendTags(postTags(createdPost.slug));

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully!",
        post: {
          id: createdPost.id,
          title: createdPost.title,
          slug: createdPost.slug,
          status: createdPost.status,
          createdAt: createdPost.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating post:", error);

    // Handle duplicate key error (slug)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A post with this slug already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to create post.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch posts (list with pagination) OR single post by ID
export async function GET(req: NextRequest) {
  try {
    // Validate user authentication
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login to perform changes" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // If ID is provided, fetch single post
    if (id) {
      // Validate ID format
      if (typeof id !== "string" || id.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid post ID format.",
          },
          { status: 400 }
        );
      }

      // Fetch the single post
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, username: true, email: true } },
          categories: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!post) {
        return NextResponse.json(
          {
            success: false,
            message: "Post not found.",
          },
          { status: 404 }
        );
      }

      // Map Prisma field names back to the API contract
      const { categories, faqItems, schemaJson, authorId: _authorId, ...rest } = post;
      const responsePost = withMongoId({
        ...rest,
        category: categories,
        faq_items: faqItems ?? [],
        additionalFields: rest.additionalFields ?? {},
        schema: schemaJson ?? null,
      });

      return NextResponse.json(
        {
          success: true,
          post: responsePost,
        },
        { status: 200 }
      );
    }

    // Otherwise, fetch list of posts (existing logic)
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build query
    const query: Prisma.PostWhereInput = {};
    if (status) {
      // An unknown status matched no documents in Mongo — keep that behavior
      // (Prisma would otherwise reject the invalid enum value).
      if (status !== "draft" && status !== "published") {
        return NextResponse.json(
          {
            success: true,
            posts: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          },
          { status: 200 }
        );
      }
      query.status = status;
    }

    // Fetch posts with only required fields
    const posts = await prisma.post.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, username: true, email: true } },
      },
    });

    // Transform posts to include all date fields
    const transformedPosts = posts.map((post) => {
      const postData: any = {
        _id: post.id,
        title: post.title,
        slug: post.slug,
        author: withMongoId(post.author),
        status: post.status,
      };

      // Include all date fields
      if (post.publishedAt) {
        postData.publishedAt = post.publishedAt;
      }
      if (post.createdAt) {
        postData.createdAt = post.createdAt;
      }
      if (post.updatedAt) {
        postData.updatedAt = post.updatedAt;
      }

      return postData;
    });

    // Get total count for pagination
    const total = await prisma.post.count({ where: query });

    return NextResponse.json(
      {
        success: true,
        posts: transformedPosts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching posts:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch posts",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // get current user
    const userResult = await requireRole(req, EDITOR_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. Please login to perform changes",
      }, { status: 401 })
    }

    // Get post ID from request body
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Post ID is required.",
        },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found.",
        },
        { status: 404 }
      );
    }

    // Delete the post
    await prisma.post.delete({ where: { id } });

    await revalidateFrontendTags(postTags(post.slug));

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully!",
      },
      { status: 200 }
    );


  } catch (error: any) {
    console.error("Error deleting post:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to delete post.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );

  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get current user (author)
    const userResult = await requireRole(req, EDITOR_ROLES);
    if (userResult instanceof NextResponse) {
      return userResult;
    }
    const userId = userResult.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login to update a post."
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const {
      id,
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      status,
      publishedAt,
      faq_items,
      additionalFields,
      schema
    } = body;

    // Validate required field: id
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Post ID is required to update a post.",
        },
        { status: 400 }
      );
    }

    // Find the existing post
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found.",
        },
        { status: 404 }
      );
    }

    // Validate that provided fields are not empty (if they are provided)
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Title cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (content !== undefined && !content.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Content cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Check if slug already exists (only if slug is being changed)
    if (slug && slug.toLowerCase().trim() !== post.slug) {
      const existingPost = await prisma.post.findFirst({
        where: {
          slug: slug.toLowerCase().trim(),
          id: { not: id }, // Exclude current post
        },
      });
      if (existingPost) {
        return NextResponse.json(
          {
            success: false,
            message: "A post with this slug already exists. Please use a different slug.",
          },
          { status: 409 }
        );
      }
    }

    // Build update data with fields if provided
    const updateData: Prisma.PostUpdateInput = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (slug !== undefined) {
      updateData.slug = slug.toLowerCase().trim();
    }

    if (content !== undefined) {
      updateData.content = content.trim();
    }

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt ? excerpt.trim() : "";
    }

    if (featuredImage !== undefined) {
      updateData.featuredImage = featuredImage ? featuredImage.trim() : "";
    }

    // Handle category update
    if (category !== undefined) {
      const categoryArray = Array.isArray(category) ? category : [category];
      const validCategoryIds = categoryArray.filter(Boolean);

      if (validCategoryIds.length > 0) {
        // Verify all categories exist in database
        const existingCategories = await prisma.category.findMany({
          where: { id: { in: validCategoryIds } },
          select: { id: true },
        });

        const existingIds = existingCategories.map((cat) => cat.id);
        const invalidIds = validCategoryIds.filter((catId: string) => !existingIds.includes(catId));

        if (invalidIds.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid category IDs: ${invalidIds.join(', ')}`,
            },
            { status: 400 }
          );
        }

        updateData.categories = { set: validCategoryIds.map((catId: string) => ({ id: catId })) };
      } else {
        // Empty array provided, assign to "Others"
        const othersCategoryId = await ensureDefaultCategory();
        updateData.categories = { set: [{ id: othersCategoryId }] };
      }
    }
    // If category is undefined, don't change existing category (preserve existing behavior)


    // Handle FAQ items update
    if (faq_items !== undefined) {
      if (!Array.isArray(faq_items)) {
        return NextResponse.json(
          {
            success: false,
            message: "FAQ items must be an array.",
          },
          { status: 400 }
        );
      }

      // Validate FAQ items
      for (const faq of faq_items) {
        if (!faq.question || !faq.answer) {
          return NextResponse.json(
            {
              success: false,
              message: "Each FAQ item must have both question and answer.",
            },
            { status: 400 }
          );
        }
      }

      updateData.faqItems = faq_items.map((faq: any) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      })) as Prisma.InputJsonValue;
    }

    // Handle additionalFields update - MERGE with existing fields
    if (additionalFields !== undefined) {
      if (typeof additionalFields !== "object" || Array.isArray(additionalFields)) {
        return NextResponse.json(
          {
            success: false,
            message: "Additional fields must be an object.",
          },
          { status: 400 }
        );
      }

      // Deep merge additionalFields with existing ones
      // This allows updating specific fields in additionalFields without losing others
      const existingFields: Record<string, any> =
        (post.additionalFields as Record<string, any>) || {};
      const mergedFields: Record<string, any> = {
        ...existingFields,
        ...additionalFields,
      };

      // Deep merge nested objects within additionalFields
      // If a field in additionalFields has nested content, merge it
      for (const key in additionalFields) {
        if (
          typeof additionalFields[key] === "object" &&
          additionalFields[key] !== null &&
          !Array.isArray(additionalFields[key]) &&
          typeof existingFields[key] === "object" &&
          existingFields[key] !== null &&
          !Array.isArray(existingFields[key])
        ) {
          // Deep merge nested objects
          mergedFields[key] = {
            ...existingFields[key],
            ...additionalFields[key],
          };
        }
      }

      updateData.additionalFields = mergedFields as Prisma.InputJsonValue;
    }

    // Handle schema update (Array of schema objects)
    if (schema !== undefined) {
      if (schema === null) {
        updateData.schemaJson = Prisma.DbNull;
      } else if (Array.isArray(schema)) {
        // Filter out any null/undefined values and ensure all items are objects
        updateData.schemaJson = schema.filter((s: any) => s !== null && s !== undefined && typeof s === "object") as Prisma.InputJsonValue;
      } else if (typeof schema === "object") {
        // If it's a single object, wrap it in an array
        updateData.schemaJson = [schema] as Prisma.InputJsonValue;
      } else {
        updateData.schemaJson = Prisma.DbNull;
      }
    }

    // Handle status and publishedAt
    if (status !== undefined) {
      // Validate status enum (Mongoose used to reject this as a ValidationError)
      if (!["draft", "published"].includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation error",
            errors: [`\`${status}\` is not a valid enum value for path \`status\`.`],
          },
          { status: 400 }
        );
      }
      updateData.status = status;

      if (status === "published") {
        if (publishedAt) {
          updateData.publishedAt = new Date(publishedAt);
        } else if (!post.publishedAt) {
          // Only set if not already published
          updateData.publishedAt = new Date();
        }
      } else {
        // If status is draft, set publishedAt to null
        updateData.publishedAt = null;
      }
    } else if (publishedAt !== undefined && post.status === "published") {
      // If only publishedAt is provided and status is already published
      updateData.publishedAt = new Date(publishedAt);
    }

    // Save the updated post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    // Clear both the old and (possibly renamed) new slug on the frontend
    const tags = new Set([...postTags(post.slug), ...postTags(updatedPost.slug)]);
    await revalidateFrontendTags([...tags]);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Post updated successfully!",
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          slug: updatedPost.slug,
          status: updatedPost.status,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating post:", error);

    // Handle duplicate key error (slug)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A post with this slug already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error. Failed to update post.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
