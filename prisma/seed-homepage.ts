// One-off seeder: fills the Homepage singleton with the built-in design
// content (defaultHomeContent), so the CMS starts from what the site shows.
// Does nothing if a homepage document already exists — pass --force to overwrite.
//
//   npx tsx prisma/seed-homepage.ts [--force]

import { PrismaClient, Prisma } from "@prisma/client";
import { HOME_META_DEFAULTS, defaultHomeContent } from "../app/lib/content/home-content";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

async function main() {
  const data = {
    metaTitle: HOME_META_DEFAULTS.metaTitle,
    metaDescription: HOME_META_DEFAULTS.metaDescription,
    content: defaultHomeContent() as unknown as Prisma.InputJsonValue,
  };

  const existing = await prisma.homePage.findFirst({ select: { id: true } });
  if (existing && !force) {
    console.log("• homepage already exists — left unchanged (use --force to overwrite)");
    return;
  }

  if (existing) {
    await prisma.homePage.update({ where: { id: existing.id }, data });
  } else {
    await prisma.homePage.create({ data });
  }
  console.log("✔ homepage seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
