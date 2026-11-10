// One-off seeder: fills the header & footer menu singletons with the
// navigation currently hardcoded in the JMT frontend, so the menus
// are database-driven from day one. Safe to re-run — overwrites the singleton.
//
//   npx tsx prisma/seed-menus.ts

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

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

const divisions = [
  { title: "Travel & Tourism", url: "/travel" },
  { title: "Documentation Solutions", url: "/services" },
  { title: "Marketing & AI", url: "/marketing" },
  { title: "Education & Career", url: "/education" },
  { title: "AI & Technology", url: "/technology" },
];

const headerMainMenu = [
  { title: "Home", url: "/", child_menu: false },
  {
    title: "Divisions",
    url: "/travel",
    child_menu: divisions.map((d) => ({ ...d, sub_child_menu: false })),
  },
  { title: "About Us", url: "/about", child_menu: false },
  { title: "Blog", url: "/blog", child_menu: false },
  { title: "Contact Us", url: "/contact", child_menu: false },
];

const headerContactDetails = {
  whatsappLabel: "WhatsApp Number",
  whatsappNumber: "+91 88664 73857",
  careLabel: "Customer Care",
  careNumber: "+91 88667 87599",
  ctaText: "Get A Quote",
  ctaUrl: "/contact",
};

const footerMainMenu = [
  {
    title: "Divisions",
    url: "#",
    child_menu: divisions.map((d) => ({ ...d, sub_child_menu: false })),
  },
  {
    title: "Company",
    url: "#",
    child_menu: [
      { title: "About Us", url: "/about", sub_child_menu: false },
      { title: "Blog", url: "/blog", sub_child_menu: false },
      { title: "Contact Us", url: "/contact", sub_child_menu: false },
    ],
  },
  {
    title: "Branch Offices",
    url: "#",
    child_menu: [
      { title: "New Delhi", url: "#", sub_child_menu: false },
      { title: "Mumbai", url: "#", sub_child_menu: false },
      { title: "Hyderabad", url: "#", sub_child_menu: false },
      { title: "Vizag", url: "#", sub_child_menu: false },
    ],
  },
];

const footerContactDetails = [
  {
    title: "Description",
    type: "text",
    value:
      "JMT (OPC) Pvt Ltd — your gateway to global opportunities. Travel, document legalization, AI marketing, education and technology solutions across India and 120+ countries.",
  },
  {
    title: "Copyright",
    type: "text",
    value: "© 2026 JMT Logistics. All rights reserved.",
  },
];

async function main() {
  const header = await withRetry("header menu", async () => {
    const existing = await prisma.headerMenu.findFirst();
    const data = {
      mainMenu: headerMainMenu as Prisma.InputJsonValue,
      contactDetails: headerContactDetails as Prisma.InputJsonValue,
    };
    return existing
      ? prisma.headerMenu.update({ where: { id: existing.id }, data })
      : prisma.headerMenu.create({ data });
  });
  console.log(`✔ header menu seeded (${(header.mainMenu as unknown[]).length} items)`);

  const footer = await withRetry("footer menu", async () => {
    const existing = await prisma.footerMenu.findFirst();
    const data = {
      mainMenu: footerMainMenu as Prisma.InputJsonValue,
      contactDetails: footerContactDetails as Prisma.InputJsonValue,
    };
    return existing
      ? prisma.footerMenu.update({ where: { id: existing.id }, data })
      : prisma.footerMenu.create({ data });
  });
  console.log(`✔ footer menu seeded (${(footer.mainMenu as unknown[]).length} columns)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
