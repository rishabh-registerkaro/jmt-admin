// Pure view-model builder for the public Joy Maa Tara homepage.
//
// SHARED FILE — an identical copy lives in both projects:
//   • jmt-admin/lib/homepage/buildHomepage.ts     (used by server/homepage.ts,
//     which reads MySQL and serves the result at GET /api/homepage/client)
//   • jmt-frontend/lib/homepage/buildHomepage.ts  (used to build the fallback
//     page when the admin API can't be reached)
// Keep them in sync. No server, Prisma or Next imports here — inputs are plain
// structural types, so Prisma rows (admin) and `null`/`[]` (fallback) both fit.

import {
  FALLBACK_CONTACT,
  FALLBACK_IMAGES,
  SERVICE_IMAGES,
  TRADES,
  type HomeMediaSlot,
} from "@/data/homepageFallback";
import {
  normalizeHomeContent,
  type HomeImageValue,
  type HomeLinkValue,
  type HomePageContent,
} from "@/app/lib/content/home-content";
import type {
  ContactInfo,
  FaqGroup,
  Href,
  HomeImage,
  HomepageData,
  InsightCard,
  NavChildLink,
  SiteChrome,
} from "@/types/homepage";

/** Cache tags — each matches a tag the admin API revalidates on save. */
export const HOMEPAGE_TAGS = {
  headerMenu: "header-menu",
  footerMenu: "footer-menu",
  services: "service-list",
  posts: "post-list",
  media: "homepage-media",
  homePage: "homepage",
} as const;

/** Seconds before cached CMS reads are refreshed even without a tag hit. */
export const HOMEPAGE_REVALIDATE_SECONDS = 600;

export const MAX_INSIGHTS = 3;

export const MEDIA_SLOTS = Object.keys(FALLBACK_IMAGES) as HomeMediaSlot[];
export const MEDIA_PREFIX = "home-";

// ── Input shapes (structural; Prisma payloads are assignable to these) ──────

export interface MenuInput {
  mainMenu: unknown;
  contactDetails: unknown;
}

/** A post row with dates already serialised to ISO strings. */
export interface PostInput {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  categories: { name: string }[];
}

export interface MediaInput {
  filename: string;
  url: string;
}

export interface HomePageInput {
  metaTitle: string | null;
  metaDescription: string | null;
  content: unknown;
}

// ── JSON helpers (menus and page content are free-form JSON columns) ─────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

/** Public marketing site origin (the separate Global Elite frontend), if configured. */
const PUBLIC_SITE_URL = stripQuotes(process.env.PRODUCTION_URL ?? "").replace(/\/+$/, "");

/**
 * Turns a CMS URL into something safe to link to from the homepage.
 * In-page anchors and absolute/tel/mailto URLs pass through. Other relative
 * paths (e.g. "/blog/x") belong to the Global Elite frontend, so they are
 * prefixed with PRODUCTION_URL, or dropped (null) when that isn't set.
 */
export function resolveHref(raw: string): Href {
  const url = raw.trim();
  if (!url || url === "#") return null;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith("#") || url === "/" || url.startsWith("/#")) return url;
  if (url.startsWith("/")) return PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}${url}` : null;
  return null;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 7 && digits.length <= 15;
}

/** Footer `contact_details` is an array of {title, type, value} rows. */
function footerDetail(details: unknown, pattern: RegExp): string {
  if (!Array.isArray(details)) return "";
  for (const row of details) {
    if (!isRecord(row)) continue;
    if (pattern.test(text(row.title)) || pattern.test(text(row.type))) return text(row.value);
  }
  return "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Writes each valid channel into `contact`; invalid or blank values are ignored. */
function applyContactChannels(
  contact: ContactInfo,
  { phone, whatsapp, email, hours }: { phone: string; whatsapp: string; email: string; hours: string },
): void {
  if (isValidPhone(phone)) {
    contact.phoneDisplay = phone;
    contact.phoneHref = `tel:+${digitsOnly(phone)}`;
  }
  if (isValidPhone(whatsapp)) {
    contact.whatsappHref = `https://wa.me/${digitsOnly(whatsapp)}`;
  }
  if (isValidEmail(email)) {
    contact.emailDisplay = email;
    contact.emailHref = `mailto:${email}`;
  }
  if (hours) contact.hours = hours;
}

/** Contact details from the shared Header/Footer Menu records (legacy source). */
function parseContact(header: MenuInput | null, footer: MenuInput | null): ContactInfo {
  const contact: ContactInfo = { ...FALLBACK_CONTACT };
  const details = header && isRecord(header.contactDetails) ? header.contactDetails : null;
  const footerDetails = footer?.contactDetails ?? null;

  applyContactChannels(contact, {
    phone: details ? text(details.careNumber) : "",
    whatsapp: details ? text(details.whatsappNumber) : "",
    email: footerDetail(footerDetails, /e-?mail/i),
    hours: footerDetail(footerDetails, /hours|timing/i),
  });

  return contact;
}

function plainText(html: string, maxLength: number): string {
  const stripped = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= maxLength) return stripped;
  return `${stripped.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

function mapPost(row: PostInput): InsightCard {
  const imageUrl = text(row.featuredImage);
  const image: HomeImage | null = /^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")
    ? { src: imageUrl, alt: row.title, width: 1200, height: 675 }
    : null;
  return {
    id: row.id,
    title: row.title,
    excerpt: plainText(row.excerpt ?? "", 160),
    category: row.categories[0]?.name ?? null,
    publishedAt: row.publishedAt ?? row.createdAt,
    href: resolveHref(`/blog/${row.slug}`),
    image,
  };
}

/** Admin can replace any section photo by uploading e.g. "home-hero.jpg" to Media. */
function applyMediaOverrides(rows: MediaInput[]): Record<HomeMediaSlot, HomeImage> {
  const images: Record<HomeMediaSlot, HomeImage> = { ...FALLBACK_IMAGES };
  const claimed = new Set<HomeMediaSlot>();
  // Rows are newest first: the latest upload for a slot wins.
  for (const row of rows) {
    const name = row.filename.toLowerCase();
    const slot = MEDIA_SLOTS.find((s) => name.startsWith(`${MEDIA_PREFIX}${s}`));
    if (slot && !claimed.has(slot) && /^https?:\/\//i.test(row.url)) {
      images[slot] = { ...FALLBACK_IMAGES[slot], src: row.url, focus: "center" };
      claimed.add(slot);
    }
  }
  return images;
}

// ── Content → view model ─────────────────────────────────────────────────────

/**
 * Homepage links belong to this site (anchors, "/", absolute URLs) and were
 * already checked by normalizeHomeContent — so unlike resolveHref they are
 * not re-pointed at the other frontend. "" or "#" means no link.
 */
function localHref(raw: string): Href {
  const url = raw.trim();
  return url && url !== "#" ? url : null;
}

function cta(link: HomeLinkValue, fallbackHref: string) {
  return { label: link.label, href: localHref(link.href) ?? fallbackHref };
}

function slugId(title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "item"}-${index}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A section photo: the CMS image if one is set, otherwise the newest
 * `home-<slot>*` Media upload, otherwise the bundled photo.
 */
function slotImage(
  value: HomeImageValue,
  slot: HomeMediaSlot,
  images: Record<HomeMediaSlot, HomeImage>,
): HomeImage {
  const base = images[slot];
  if (value.src) {
    return { ...FALLBACK_IMAGES[slot], src: value.src, alt: value.alt || base.alt, focus: value.focus };
  }
  return { ...base, alt: value.alt || base.alt };
}

/** A card photo, or null when the field is empty. Size is nominal — Photo uses `fill`. */
function cardImage(value: HomeImageValue, fallbackAlt: string): HomeImage | null {
  if (!value.src) return null;
  return { src: value.src, alt: value.alt || fallbackAlt, width: 1200, height: 800, focus: value.focus };
}

function toHomepageData(
  content: HomePageContent,
  meta: HomepageData["meta"],
  images: Record<HomeMediaSlot, HomeImage>,
  insights: InsightCard[],
): HomepageData {
  const { hero, services, sites, why, trades, process, founder, banner, faq, contact } = content;

  const faqs: FaqGroup[] = (["companies", "workers"] as const)
    .map((audience) => ({
      audience,
      label: faq[audience].label,
      items: faq[audience].items
        .filter((item) => item.question)
        .map((item, index) => ({ id: slugId(item.question, index), ...item })),
    }))
    .filter((group) => group.items.length > 0);

  const serviceCards = services.cards.filter((card) => card.title);
  const siteCards = sites.cards.filter((card) => card.title);
  const tradeCards = trades.cards.filter((card) => card.title);
  const steps = process.steps.filter((step) => step.title);

  return {
    // A section with nothing to show is hidden rather than rendered empty.
    enabled: {
      hero: hero.enabled,
      services: services.enabled && serviceCards.length > 0,
      sites: sites.enabled && siteCards.length > 0,
      why: why.enabled,
      trades: trades.enabled && tradeCards.length > 0,
      process: process.enabled && steps.length > 0,
      founder: founder.enabled,
      banner: banner.enabled,
      faq: faq.enabled && faqs.length > 0,
      contact: contact.enabled,
    },
    meta,
    hero: {
      eyebrow: hero.eyebrow,
      titleLead: hero.titleLead,
      titleAccent: hero.titleAccent,
      titleTail: hero.titleTail,
      subtitle: hero.subtitle,
      primaryCta: hero.primaryCta.label,
      primaryHref: localHref(hero.primaryCta.href) ?? "#contact",
      secondaryCta: hero.secondaryCta.label,
      secondaryHref: localHref(hero.secondaryCta.href) ?? "#join-our-crew",
      whatsappCta: hero.whatsappCta,
      trustPoints: hero.trustPoints.filter((point) => point.label),
      image: slotImage(hero.image, "hero", images),
    },
    services: serviceCards.map((card, index) => ({
      id: slugId(card.title, index),
      title: card.title,
      eyebrow: card.eyebrow || null,
      badge: card.badge || null,
      href: localHref(card.href),
      image: cardImage(card.image, card.title) ?? SERVICE_IMAGES[index % SERVICE_IMAGES.length],
    })),
    servicesCopy: {
      heading: { lead: services.titleLead, accent: services.titleAccent },
      intro: services.intro,
      cta: cta(services.cta, "#contact"),
    },
    siteTypes: siteCards.map((card, index) => ({
      id: slugId(card.title, index),
      title: card.title,
      description: card.description,
      image: cardImage(card.image, card.title),
    })),
    sitesCopy: { title: sites.title },
    reasons: why.reasons
      .filter((reason) => reason.title)
      .map((reason, index) => ({ number: pad(index + 1), ...reason })),
    reasonsImage: slotImage(why.image, "why", images),
    whyCopy: {
      heading: { lead: why.titleLead, accent: why.titleAccent },
      intro: why.intro,
      badge: why.badge,
    },
    trades: tradeCards.map((card, index) => ({
      id: slugId(card.title, index),
      title: card.title,
      icon: card.icon,
      image: cardImage(card.image, card.title) ?? TRADES[index % TRADES.length].image,
    })),
    tradesCopy: { title: trades.title, intro: trades.intro },
    process: steps.map((step, index) => ({ number: pad(index + 1), ...step })),
    processCopy: {
      heading: { lead: process.titleLead, accent: process.titleAccent },
      intro: process.intro,
    },
    founder: {
      name: founder.name,
      initials: founder.initials,
      role: founder.role,
      heading: founder.heading,
      story: founder.story,
      image: slotImage(founder.image, "founder", images),
      assurances: founder.assurances.filter(Boolean),
      ctaLabel: founder.ctaLabel,
    },
    banner: {
      title: banner.title,
      copy: banner.copy,
      cta: cta(banner.cta, "#trades"),
      image: slotImage(banner.image, "banner", images),
    },
    faqs,
    faqCopy: {
      title: faq.title,
      intro: faq.intro,
      ownerRole: faq.ownerRole,
      ownerTitle: faq.ownerTitle,
      ownerText: faq.ownerText,
      moreText: faq.moreText,
      moreLink: cta(faq.moreLink, "#contact"),
    },
    insights,
    contactImage: slotImage(contact.image, "contact", images),
    contactCopy: {
      title: contact.title,
      cardTitle: contact.cardTitle,
      cardText: contact.cardText,
      formTitle: contact.formTitle,
      formText: contact.formText,
    },
  };
}

function toLinks(links: HomeLinkValue[]): NavChildLink[] {
  return links.filter((link) => link.label).map((link) => ({ label: link.label, href: localHref(link.href) }));
}

// ── Public builders ──────────────────────────────────────────────────────────

/**
 * Navbar, footer and contact details. Pass `null` for anything unavailable —
 * with all three null this is the bundled (Figma) navbar/footer.
 */
export function buildSiteChrome(
  header: MenuInput | null,
  footer: MenuInput | null,
  row: HomePageInput | null,
): SiteChrome {
  // With no saved document this is the Figma navbar/footer.
  const { site } = normalizeHomeContent(row?.content);

  // Contact: the shared Header/Footer Menu values first (legacy source), then
  // this homepage's own details on top. A blank field keeps the legacy value.
  const contact = parseContact(header, footer);
  if (row) {
    applyContactChannels(contact, site);
    if (site.replyTime) contact.replyTime = site.replyTime;
  }

  return {
    nav: site.nav
      .filter((item) => item.label)
      .map((item) => ({ label: item.label, href: localHref(item.href), children: toLinks(item.children) })),
    footerColumns: site.footerColumns
      .filter((column) => column.title)
      .map((column) => ({ title: column.title, links: toLinks(column.links) })),
    footerDescription: site.footerDescription,
    copyright: site.copyright || null,
    contact,
  };
}

/**
 * All section content for the homepage. Pass `null` / `[]` for anything
 * unavailable — with no inputs this is the bundled (Figma) homepage.
 */
export function buildHomepageData(
  row: HomePageInput | null,
  posts: PostInput[],
  media: MediaInput[],
): HomepageData {
  return toHomepageData(
    normalizeHomeContent(row?.content),
    { title: row?.metaTitle || null, description: row?.metaDescription || null },
    applyMediaOverrides(media),
    posts.map(mapPost),
  );
}
