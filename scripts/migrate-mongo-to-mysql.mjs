/**
 * One-time data migration: MongoDB → MySQL (Prisma).
 *
 * Usage:
 *   1. Ensure .env contains MONGO_URI, DB_NAME (old Mongo) and DATABASE_URL (new MySQL)
 *   2. npx prisma migrate deploy   (creates the MySQL tables)
 *   3. node scripts/migrate-mongo-to-mysql.mjs
 *
 * Idempotent-ish: uses upserts keyed on the original Mongo ObjectId strings,
 * so re-running after a partial failure is safe.
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import { PrismaClient } from "@prisma/client";

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
if (!MONGO_URI || !DB_NAME) {
  console.error("Set MONGO_URI and DB_NAME in .env");
  process.exit(1);
}

const prisma = new PrismaClient();
const mongo = new MongoClient(MONGO_URI);

const sid = (v) => (v == null ? null : String(v));
const json = (v) => (v === undefined ? undefined : v ?? undefined);

async function main() {
  await mongo.connect();
  const db = mongo.db(DB_NAME);
  const col = (name) => db.collection(name).find({}).toArray();

  // ── Users ──────────────────────────────────────────────────────
  const users = await col("users");
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: sid(u._id) },
      create: {
        id: sid(u._id),
        email: u.email,
        username: u.username,
        password: u.password, // bcrypt hash ports unchanged
        role: u.role ?? "contributor",
        createdAt: u.createdAt ?? new Date(),
        updatedAt: u.updatedAt ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`users: ${users.length}`);
  const fallbackAuthor = users[0] ? sid(users[0]._id) : null;

  // ── Categories (parents first) ─────────────────────────────────
  const categories = await col("categories");
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: sid(c._id) },
      create: {
        id: sid(c._id),
        name: c.name,
        slug: c.slug,
        color: c.color ?? "",
        createdAt: c.createdAt ?? new Date(),
        updatedAt: c.updatedAt ?? new Date(),
      },
      update: {},
    });
  }
  for (const c of categories) {
    if (c.parentCategory) {
      await prisma.category.update({
        where: { id: sid(c._id) },
        data: { parentId: sid(c.parentCategory) },
      });
    }
  }
  console.log(`categories: ${categories.length}`);

  // ── Posts (+ category join) ────────────────────────────────────
  const posts = await col("posts");
  for (const p of posts) {
    const authorId = sid(p.author) ?? fallbackAuthor;
    if (!authorId) throw new Error(`Post ${p._id} has no author and no fallback user exists`);
    const catIds = (p.category ?? []).map(sid).filter(Boolean);
    await prisma.post.upsert({
      where: { id: sid(p._id) },
      create: {
        id: sid(p._id),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt ?? "",
        content: p.content ?? "",
        featuredImage: p.featuredImage ?? null,
        status: p.status ?? "draft",
        authorId,
        faqItems: json(p.faq_items) ?? [],
        additionalFields: json(p.additionalFields) ?? {},
        schemaJson: json(p.schema),
        publishedAt: p.publishedAt ?? null,
        createdAt: p.createdAt ?? new Date(),
        updatedAt: p.updatedAt ?? new Date(),
        categories: { connect: catIds.map((id) => ({ id })) },
      },
      update: {},
    });
  }
  console.log(`posts: ${posts.length}`);

  // ── Service packages ───────────────────────────────────────────
  const packages = await col("servicepackages");
  for (const pk of packages) {
    await prisma.servicePackage.upsert({
      where: { id: sid(pk._id) },
      create: {
        id: sid(pk._id),
        serviceName: pk.serviceName,
        packageName: pk.packageName,
        packageTier: pk.packageTier,
        priceVariants: json(pk.priceVariants) ?? [],
        description: pk.description ?? null,
        features: json(pk.features) ?? [],
        isActive: pk.isActive ?? true,
        isPopular: pk.isPopular ?? false,
        displayOrder: pk.displayOrder ?? 0,
        billingCycle: (pk.billingCycle ?? "one-time") === "one-time" ? "one_time" : pk.billingCycle,
        createdAt: pk.createdAt ?? new Date(),
        updatedAt: pk.updatedAt ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`service packages: ${packages.length}`);

  // ── Leads ──────────────────────────────────────────────────────
  const leads = await col("leads");
  for (const l of leads) {
    await prisma.lead.upsert({
      where: { id: sid(l._id) },
      create: {
        id: sid(l._id),
        name: l.name,
        email: l.email,
        phoneNo: l.phoneNo,
        companyName: l.companyName ?? null,
        region: l.region ?? "Unknown",
        serviceSelected: l.serviceSelected ?? "Unknown",
        message: l.message ?? null,
        status: l.status ?? "new",
        leadSource: l.leadSource ?? "Website",
        hasPayment: l.hasPayment ?? false,
        packageId: sid(l.packageId),
        packageName: l.packageName ?? null,
        razorpayOrderId: l.razorpayOrderId ?? null,
        razorpayPaymentId: l.razorpayPaymentId ?? null,
        razorpaySignature: l.razorpaySignature ?? null,
        paymentStatus: l.paymentStatus ?? null,
        amount: l.amount ?? null,
        currency: l.currency ?? null,
        paymentMethod: l.paymentMethod ?? null,
        paidAt: l.paidAt ?? null,
        adminNotes: l.adminNotes ?? null,
        lastContactedAt: l.lastContactedAt ?? null,
        createdAt: l.createdAt ?? new Date(),
        updatedAt: l.updatedAt ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`leads: ${leads.length}`);

  // ── Registrations ──────────────────────────────────────────────
  const registrations = await col("registrations");
  for (const r of registrations) {
    await prisma.registration.upsert({
      where: { id: sid(r._id) },
      create: {
        id: sid(r._id),
        email: r.email,
        pageSource: r.pageSource,
        pageUrl: r.pageUrl,
        metadata: json(r.metadata) ?? {},
        createdAt: r.createdAt ?? new Date(),
        updatedAt: r.updatedAt ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`registrations: ${registrations.length}`);

  // ── Media assets ───────────────────────────────────────────────
  const media = await col("mediaassets");
  for (const m of media) {
    await prisma.mediaAsset.upsert({
      where: { id: sid(m._id) },
      create: {
        id: sid(m._id),
        key: m.key,
        filename: m.filename,
        format: m.format,
        resourceType: m.resource_type,
        bytes: m.bytes,
        url: m.url,
        createdAt: m.createdAt ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`media assets: ${media.length}`);

  // ── Service pages ──────────────────────────────────────────────
  const servicePages = await col("servicepages");
  for (const s of servicePages) {
    const authorId = sid(s.author) ?? fallbackAuthor;
    await prisma.servicePage.upsert({
      where: { id: sid(s._id) },
      create: {
        id: sid(s._id),
        slug: s.slug,
        metaTitle: s.metaTitle ?? null,
        metaDescription: s.metaDescription ?? null,
        heroSection: json(s.heroSection) ?? {},
        featuresSection: json(s.featuresSection),
        pantryScannerSection: json(s.pantryScannerSection),
        voiceListeningSection: json(s.voiceListeningSection),
        howItWorksSection: json(s.howItWorksSection),
        pricingSection: json(s.pricingSection),
        integrationsSection: json(s.integrationsSection),
        status: s.status ?? "draft",
        authorId,
        createdAt: s.createdAt ?? new Date(),
        updatedAt: s.updatedAt ?? new Date(),
      },
      update: {},
    });
  }
  console.log(`service pages: ${servicePages.length}`);

  // ── Singleton pages ────────────────────────────────────────────
  const singletons = [
    ["aboutpages", "aboutPage", (d) => ({
      metaTitle: d.metaTitle ?? null,
      metaDescription: d.metaDescription ?? null,
      heroSection: json(d.heroSection),
      aboutSection: json(d.aboutSection),
      approachSection: json(d.approachSection),
      teamSection: json(d.teamSection),
      foundersNoteSection: json(d.foundersNoteSection),
    })],
    ["contactpages", "contactPage", (d) => ({
      metaTitle: d.metaTitle ?? null,
      metaDescription: d.metaDescription ?? null,
      content: json(d.content) ?? {},
    })],
    ["termspolicies", "termsPolicy", (d) => ({
      metaTitle: d.metaTitle ?? null,
      metaDescription: d.metaDescription ?? null,
      title: d.title ?? null,
      subTitle: d.subTitle ?? null,
      content: json(d.content) ?? {},
      privacyPolicyContent: json(d.privacyPolicyContent) ?? {},
    })],
    ["headermenus", "headerMenu", (d) => ({ mainMenu: json(d.main_menu) ?? [] })],
    ["footermenus", "footerMenu", (d) => ({
      mainMenu: json(d.main_menu) ?? [],
      contactDetails: json(d.contact_details) ?? [],
    })],
  ];
  for (const [collection, model, map] of singletons) {
    const docs = await col(collection);
    for (const d of docs) {
      await prisma[model].upsert({
        where: { id: sid(d._id) },
        create: {
          id: sid(d._id),
          ...map(d),
          createdAt: d.createdAt ?? new Date(),
          updatedAt: d.updatedAt ?? new Date(),
        },
        update: {},
      });
    }
    console.log(`${collection}: ${docs.length}`);
  }

  // OTPs are ephemeral (password-reset codes) — intentionally not migrated.
  console.log("\nDone. Verify row counts above against your Mongo collections.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongo.close();
  });
