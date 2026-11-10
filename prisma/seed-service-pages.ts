// One-off seeder: upserts the four division pages (travel, technology,
// education, marketing) from app/lib/content/service-templates.ts so the DB
// matches the live frontend content. Safe to re-run — it upserts by slug.
//
//   npx tsx prisma/seed-service-pages.ts

import { PrismaClient, Prisma } from "@prisma/client";
import { SERVICE_TEMPLATES } from "../app/lib/content/service-templates";

const prisma = new PrismaClient();

// The Hostinger remote MySQL drops connections intermittently — retry a few times.
async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt >= tries || !msg.includes("Can't reach database server")) throw err;
      console.log(`  ${label}: connection dropped, retrying (${attempt}/${tries})…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  const author = await withRetry("find author", () =>
    prisma.user.findFirst({
      where: { role: { in: ["superadmin", "admin"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true },
    })
  );
  if (!author) throw new Error("No admin/superadmin user found to own the seeded pages.");
  console.log(`Seeding as author: ${author.username}`);

  for (const tpl of SERVICE_TEMPLATES) {
    if (tpl.key === "blank") continue;
    const data = {
      template: "division",
      metaTitle: tpl.metaTitle,
      metaDescription: tpl.metaDescription,
      content: tpl.content as unknown as Prisma.InputJsonValue,
      status: "published" as const,
    };
    await withRetry(tpl.slug, () =>
      prisma.servicePage.upsert({
        where: { slug: tpl.slug },
        update: data,
        create: { slug: tpl.slug, ...data, authorId: author.id },
      })
    );
    console.log(`  ✔ upserted /${tpl.slug}`);
  }

  const count = await withRetry("count", () => prisma.servicePage.count());
  console.log(`Done — ${count} service pages in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
