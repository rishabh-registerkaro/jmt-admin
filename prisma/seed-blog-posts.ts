// One-off seeder: creates the blog categories + the seven JMT Journal
// articles that were previously hardcoded in the frontend, so the blog is
// fully database-driven. Safe to re-run — upserts by slug.
//
//   npx tsx prisma/seed-blog-posts.ts

import { PrismaClient, Prisma } from "@prisma/client";

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

const CATEGORIES = [
  { name: "Apostille", slug: "apostille" },
  { name: "Attestation", slug: "attestation" },
  { name: "Embassy", slug: "embassy" },
  { name: "Translation", slug: "translation" },
  { name: "Country Guides", slug: "country-guides" },
];

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string; // category slug
  publishedAt: string;
  content: string;
  faqItems?: { question: string; answer: string }[];
};

const POSTS: SeedPost[] = [
  {
    slug: "apostille-vs-attestation",
    title: "Apostille vs Attestation: which one does your document actually need?",
    excerpt:
      "A clear, country-by-country breakdown of when the Hague apostille applies and when full embassy attestation is required — so you never pay for the wrong process.",
    category: "apostille",
    publishedAt: "2026-05-28",
    content: `
<h2>What is an apostille?</h2>
<p>An apostille is a standardised certificate issued by the Ministry of External Affairs (MEA) that authenticates the origin of a public document. Once apostilled, your document is automatically recognised in every country that is a member of the Hague Apostille Convention of 1961 — with no further embassy step required.</p>
<blockquote>An apostille is recognised across 120+ countries — a single sticker that replaces a whole chain of consular stamps.</blockquote>
<h2>What is attestation?</h2>
<p>Attestation is the route for <b>non-Hague countries</b> — the UAE, Saudi Arabia, Qatar, Kuwait and others. It follows a longer chain: state verification, then MEA attestation, and finally a stamp from the destination country's embassy in India.</p>
<h2>Key differences at a glance</h2>
<table><thead><tr><th>Aspect</th><th>Apostille</th><th>Attestation</th></tr></thead><tbody>
<tr><td>Used for</td><td>Hague countries</td><td>Non-Hague countries</td></tr>
<tr><td>Final step</td><td>MEA sticker</td><td>Embassy stamp</td></tr>
<tr><td>Typical time</td><td>5–7 days</td><td>10–15 days</td></tr>
</tbody></table>
<h2>Which one do you need?</h2>
<p>It comes down to a single question: <b>is your destination country a member of the Hague Convention?</b> If yes, you need an apostille. If no, you need attestation. When in doubt, our team confirms the requirement for your exact document and destination before you pay.</p>
<ul>
<li><b>Germany, France, Australia, Italy</b> — apostille</li>
<li><b>UAE, Saudi Arabia, Qatar, Kuwait</b> — attestation</li>
</ul>`,
    faqItems: [
      {
        question: "Can a document have both an apostille and attestation?",
        answer:
          "It never needs both. The destination country determines the route — Hague members accept the apostille alone, non-Hague countries require the attestation chain ending at their embassy.",
      },
      {
        question: "Does an apostille expire?",
        answer:
          "No, an apostille does not expire. However, some authorities prefer documents apostilled within the last 6 months, so check your destination's specific requirement.",
      },
    ],
  },
  {
    slug: "apostille-degree-certificate-2026",
    title: "How to apostille your degree certificate in 2026",
    excerpt:
      "A step-by-step walkthrough of HRD verification, MEA submission and what changed this year.",
    category: "apostille",
    publishedAt: "2026-05-24",
    content: `
<h2>Step 1: HRD verification</h2>
<p>For most states, your degree must first be authenticated by the issuing state's Human Resource Development (HRD) department. The university confirms the certificate is genuine, and the HRD desk applies its verification signature and seal.</p>
<h2>Step 2: MEA submission</h2>
<p>The verified degree then goes to the Ministry of External Affairs through an authorised outsource agency — the MEA no longer accepts documents directly from individuals. The Hague apostille sticker, with its unique verification number, is affixed to the original document.</p>
<h2>What changed in 2026</h2>
<p>Processing is now fully decentralised across 16 Branch Secretariats and RPOs, and every apostille is entered in the MEA e-Register — so employers and universities abroad can verify your sticker online within minutes.</p>
<ul>
<li>Typical end-to-end turnaround: <b>5–7 working days</b></li>
<li>You need the <b>original degree</b>, all mark sheets, and a passport copy</li>
<li>The sticker is verifiable online via its unique number</li>
</ul>
<h2>Common rejection reasons</h2>
<p>Laminated originals, name mismatches between the degree and passport, and missing mark sheets are the three most common reasons a file bounces. Fix these before pickup and the process is smooth.</p>`,
  },
  {
    slug: "uae-attestation-document-checklist",
    title: "UAE attestation: the complete document checklist",
    excerpt:
      "Everything you need before submitting for UAE embassy attestation, including Chamber of Commerce steps.",
    category: "embassy",
    publishedAt: "2026-05-19",
    content: `
<h2>Personal documents</h2>
<p>For employment or family visas, the UAE requires the full attestation chain on personal documents. Prepare the originals plus passport copies of the document holder.</p>
<ul>
<li>Degree certificate (HRD + MEA + UAE Embassy)</li>
<li>Birth certificate (Home Department + MEA + UAE Embassy)</li>
<li>Marriage certificate (Home Department + MEA + UAE Embassy)</li>
</ul>
<h2>Commercial documents</h2>
<p>Company papers route through the <b>Chamber of Commerce</b> instead of state departments — incorporation certificates, board resolutions and commercial invoices all need the Chamber stamp before the MEA and embassy steps.</p>
<h2>The MOFA step in the UAE</h2>
<p>After the UAE Embassy in India stamps your document, it must be counter-attested by the Ministry of Foreign Affairs (MOFA) once you arrive in the UAE. Only then is it accepted by employers, courts and immigration.</p>
<blockquote>Budget 10–15 working days for the India-side chain, plus the MOFA step on arrival.</blockquote>`,
  },
  {
    slug: "moving-to-germany-documents-to-apostille",
    title: "Moving to Germany? Documents you must apostille first",
    excerpt:
      "Degrees, birth and marriage certificates — the exact set German authorities expect, and in what order.",
    category: "country-guides",
    publishedAt: "2026-05-14",
    content: `
<h2>Germany accepts apostilles</h2>
<p>Germany is a Hague Convention member, so a single MEA apostille per document is all German authorities require — no embassy attestation, no consulate queues.</p>
<h2>For a work or Blue Card visa</h2>
<ul>
<li><b>Degree certificate</b> — apostilled, for ZAB recognition and the visa file</li>
<li><b>Mark sheets</b> — apostilled if your employer or university asks for course details</li>
<li><b>Birth certificate</b> — apostilled, for the Anmeldung and residence permit</li>
</ul>
<h2>For family reunification</h2>
<p>The <b>marriage certificate</b> is the critical document — Germany insists on an apostilled original, and most Standesamt offices also want a certified German translation done by a sworn translator.</p>
<h2>The right order</h2>
<p>Apostille first, translate second. German authorities want the translation to cover the apostille sticker itself, so a translation done before apostilling usually has to be redone.</p>`,
  },
  {
    slug: "when-do-you-need-a-certified-translation",
    title: "When do you need a certified translation?",
    excerpt:
      "Sworn vs notarised translations explained, and which embassies insist on each.",
    category: "translation",
    publishedAt: "2026-05-09",
    content: `
<h2>Certified vs sworn vs notarised</h2>
<p>A <b>certified translation</b> carries the translator's signed declaration of accuracy. A <b>sworn translation</b> is produced by a translator registered with a court (common in Germany, France, Spain). A <b>notarised translation</b> adds a notary's seal over the translator's declaration.</p>
<h2>Who asks for what</h2>
<table><thead><tr><th>Destination</th><th>Requirement</th></tr></thead><tbody>
<tr><td>Germany, France, Spain</td><td>Sworn translator in that country</td></tr>
<tr><td>UAE, Qatar</td><td>Legal translation by licensed office</td></tr>
<tr><td>USA, UK, Australia</td><td>Certified translation is usually enough</td></tr>
</tbody></table>
<h2>Translate before or after legalisation?</h2>
<p>Almost always <b>after</b>. Embassies and foreign registries want the apostille or attestation stamps included in the translation, so finish the legalisation chain first.</p>`,
  },
  {
    slug: "e-sanad-digital-apostille-route",
    title: "e-Sanad explained: the digital apostille route",
    excerpt:
      "How the MEA's online verification service speeds up eligible documents from days to hours.",
    category: "apostille",
    publishedAt: "2026-05-02",
    content: `
<h2>What is e-Sanad?</h2>
<p>e-Sanad is the MEA's online channel for document attestation and apostille. Instead of couriering originals between desks, the document's digital copy is verified against the issuing authority's own database.</p>
<h2>How the flow works</h2>
<ul>
<li>Apply and pay online on the e-Sanad portal</li>
<li>Your data is shared digitally with the MEA</li>
<li>The concerned DIA/GAD verifies the record</li>
<li>The MEA digitally signs, and the apostilled document is dispatched</li>
</ul>
<h2>The catch: coverage</h2>
<p>e-Sanad only works when the issuing university or board has digitised its records and joined the platform. For everything else, the physical HRD + MEA route remains the way — which is where a managed service saves you the branch-office chase.</p>`,
  },
  {
    slug: "corporate-document-attestation-global-tenders",
    title: "Corporate document attestation for global tenders",
    excerpt:
      "Incorporation papers, board resolutions and invoices — the commercial attestation chain in full.",
    category: "attestation",
    publishedAt: "2026-04-27",
    content: `
<h2>Why tenders need attested papers</h2>
<p>Gulf and African tender authorities routinely reject bids whose supporting corporate documents lack consular attestation. The attestation chain proves your incorporation papers and authorisations are genuine.</p>
<h2>The commercial chain</h2>
<p>Commercial documents skip the state HRD/Home departments. Instead the route is: <b>Chamber of Commerce → MEA → destination country's embassy</b>.</p>
<ul>
<li>Certificate of incorporation</li>
<li>Board resolution authorising the signatory</li>
<li>Power of attorney for the local agent</li>
<li>Commercial invoices and agreements</li>
</ul>
<h2>Timelines and originals</h2>
<p>Plan 8–12 working days per destination country. Embassies stamp originals, so build the attestation window into your bid schedule — a missed stamp is a missed tender.</p>`,
  },
];

async function main() {
  const author = await withRetry("find author", () =>
    prisma.user.findFirst({
      where: { role: { in: ["superadmin", "admin"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true },
    })
  );
  if (!author) throw new Error("No admin/superadmin user found to own the seeded posts.");
  console.log(`Seeding as author: ${author.username}`);

  const catIds = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const row = await withRetry(`category ${cat.slug}`, () =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: cat,
      })
    );
    catIds.set(cat.slug, row.id);
    console.log(`  ✔ category ${cat.name}`);
  }

  for (const post of POSTS) {
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content.trim(),
      status: "published" as const,
      publishedAt: new Date(post.publishedAt),
      faqItems: (post.faqItems ?? undefined) as Prisma.InputJsonValue | undefined,
      categories: { set: [], connect: [{ id: catIds.get(post.category)! }] },
    };
    await withRetry(post.slug, () =>
      prisma.post.upsert({
        where: { slug: post.slug },
        update: data,
        create: {
          slug: post.slug,
          ...data,
          categories: { connect: [{ id: catIds.get(post.category)! }] },
          authorId: author.id,
        },
      })
    );
    console.log(`  ✔ upserted /blog/${post.slug}`);
  }

  const count = await withRetry("count", () => prisma.post.count());
  console.log(`Done — ${count} posts in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
