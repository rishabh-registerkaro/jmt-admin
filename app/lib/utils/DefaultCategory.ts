import prisma from "@/app/lib/config/db";

const OTHERS_CATEGORY_SLUG = "others";

/**
 * Ensures the "Others" default category exists in the database
 * This category cannot be a parent or child category
 * @returns The id of the "Others" category
 */
export async function ensureDefaultCategory(): Promise<string> {
  // Try to find existing "Others" category
  let othersCategory = await prisma.category.findUnique({
    where: { slug: OTHERS_CATEGORY_SLUG },
  });

  if (!othersCategory) {
    // Create "Others" category if it doesn't exist
    othersCategory = await prisma.category.create({
      data: {
        name: "Others",
        slug: OTHERS_CATEGORY_SLUG,
        parentId: null, // Cannot be a child
      },
    });
  }

  return othersCategory.id;
}
