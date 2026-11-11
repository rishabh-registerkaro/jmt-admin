// SHARED FILE — an identical copy lives in jmt-admin/app/lib/content/home-content.ts and
// jmt-frontend/app/lib/content/home-content.ts. Change both together.
//
// Shared content model for the public homepage (Joy Maa Tara Bama Kripa).
//
// The whole page lives in one JSON column (`home_pages.content`), so copy and
// list changes never need a schema migration. This module is pure (no server
// imports) and is shared by:
//   • the admin editor   (jmt-admin app/dashboard/homepage)  — defaults + normalise on load
//   • the API route       (jmt-admin app/api/homepage)        — sanitise before saving
//   • the public fetcher  (jmt-admin server/homepage.ts)      — safe read of stored JSON
//   • the fallback page   (jmt-frontend server/homepage.ts)   — content when the API is down
//
// Images: an empty `src` means "use the default" — for the five photo slots
// (hero, why, founder, banner, contact) that is the newest `home-<slot>*` Media
// upload if there is one, otherwise the bundled photo in /public/homepage.

import {
  BRAND_LOGOS,
  CONTACT_LABELS,
  FALLBACK_CHROME,
  FALLBACK_CONTACT,
  FALLBACK_HERO,
  FALLBACK_IMAGES,
  FALLBACK_SERVICES,
  FAQ_GROUPS,
  FOUNDER,
  LEAD_FORM_COPY,
  PROCESS_STEPS,
  REASONS,
  SITE_TYPES,
  TRADES,
} from "@/data/homepageFallback";
import { SEED_TRANSLATIONS } from "@/data/homepageTranslations";
import {
  LEAD_FIELDS,
  SWITCHER_LANGUAGES,
  type FaqAudience,
  type HeroTrustIcon,
  type ImageFocus,
  type LeadField,
  type ProcessIcon,
  type SwitcherLanguage,
  type TradeIcon,
} from "@/types/homepage";

// ── Enums (exported for the editor's selects) ────────────────────────────────

export const IMAGE_FOCUS_OPTIONS: readonly ImageFocus[] = ["center", "top", "upper", "left", "right"];
export const HERO_ICONS: readonly HeroTrustIcon[] = ["verified", "fast", "support"];
export const TRADE_ICONS: readonly TradeIcon[] = ["masonry", "shuttering", "welding", "helpers"];
export const PROCESS_ICONS: readonly ProcessIcon[] = ["requirement", "site-visit", "crew", "records"];
export const FAQ_AUDIENCES: readonly FaqAudience[] = ["companies", "workers"];

export const HOME_SECTION_KEYS = [
  "hero",
  "services",
  "sites",
  "why",
  "trades",
  "process",
  "founder",
  "banner",
  "faq",
  "contact",
] as const;
export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

/** List caps — keep the layout sane and the JSON small. */
export const HOME_LIMITS = {
  trustPoints: 4,
  services: 4,
  sites: 12,
  reasons: 8,
  trades: 8,
  steps: 6,
  assurances: 12,
  faqItems: 20,
  nav: 8,
  navChildren: 10,
  footerColumns: 3,
  footerLinks: 10,
} as const;

// ── Shapes ───────────────────────────────────────────────────────────────────

export interface HomeImageValue {
  /** Absolute https URL (Media Library) or a /public path. Empty = default. */
  src: string;
  alt: string;
  focus: ImageFocus;
}

export interface HomeLinkValue {
  label: string;
  /** "#section", "/path", "https://…", "tel:…" or "mailto:…". */
  href: string;
}

export interface HomeNavValue extends HomeLinkValue {
  children: HomeLinkValue[];
}

export interface HomeFaqGroupValue {
  label: string;
  items: { question: string; answer: string }[];
}

export interface HomeLanguageValue {
  /** Fixed: one entry per language the translator supports. */
  code: (typeof SWITCHER_LANGUAGES)[number];
  label: string;
  name: string;
  /** Hidden languages are left out of the switcher (English always shows). */
  enabled: boolean;
}

export interface HomeLeadFormValue {
  labels: Record<LeadField, string>;
  optionalHint: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successText: string;
  resetLabel: string;
  invalidText: string;
  errorText: string;
}

export interface HomePageContent {
  /** Every section key once, top to bottom. */
  sectionOrder: HomeSectionKey[];
  hero: {
    enabled: boolean;
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    titleTail: string;
    subtitle: string;
    primaryCta: HomeLinkValue;
    secondaryCta: HomeLinkValue;
    whatsappCta: string;
    trustPoints: { icon: HeroTrustIcon; label: string }[];
    image: HomeImageValue;
  };
  services: {
    enabled: boolean;
    titleLead: string;
    titleAccent: string;
    intro: string;
    cta: HomeLinkValue;
    cards: { title: string; eyebrow: string; badge: string; href: string; image: HomeImageValue }[];
  };
  sites: {
    enabled: boolean;
    title: string;
    cards: { title: string; description: string; href: string; image: HomeImageValue }[];
  };
  why: {
    enabled: boolean;
    titleLead: string;
    titleAccent: string;
    intro: string;
    badge: string;
    image: HomeImageValue;
    reasons: { title: string; description: string; tag: string }[];
  };
  trades: {
    enabled: boolean;
    title: string;
    intro: string;
    cards: { title: string; icon: TradeIcon; image: HomeImageValue }[];
  };
  process: {
    enabled: boolean;
    titleLead: string;
    titleAccent: string;
    intro: string;
    steps: { icon: ProcessIcon; title: string; description: string; outcomeLabel: string; outcome: string }[];
  };
  founder: {
    enabled: boolean;
    name: string;
    initials: string;
    role: string;
    heading: string;
    story: string;
    ctaLabel: string;
    image: HomeImageValue;
    assurances: string[];
  };
  banner: {
    enabled: boolean;
    title: string;
    copy: string;
    cta: HomeLinkValue;
    image: HomeImageValue;
  };
  faq: {
    enabled: boolean;
    title: string;
    intro: string;
    ownerRole: string;
    ownerTitle: string;
    ownerText: string;
    moreText: string;
    moreLink: HomeLinkValue;
    companies: HomeFaqGroupValue;
    workers: HomeFaqGroupValue;
  };
  contact: {
    enabled: boolean;
    title: string;
    cardTitle: string;
    cardText: string;
    labels: { call: string; whatsapp: string; whatsappValue: string; reply: string };
    formTitle: string;
    formText: string;
    form: HomeLeadFormValue;
    image: HomeImageValue;
  };
  /** Site-wide details for this homepage: navbar, footer and contact channels. */
  site: {
    brand: {
      /** Read out by screen readers on the logo links. */
      name: string;
      /** Empty src = the bundled logo. */
      headerLogo: HomeImageValue;
      footerLogo: HomeImageValue;
    };
    labels: {
      callButton: string;
      whatsappButton: string;
      /** Footer text for the WhatsApp link; blank shows the number. */
      whatsappDisplay: string;
      footerContactTitle: string;
    };
    languages: { enabled: boolean; items: HomeLanguageValue[] };
    /** Blank = keep using the Header Menu care number. */
    phone: string;
    /** Blank = keep using the Header Menu WhatsApp number. */
    whatsapp: string;
    /** Blank = keep using the Footer Menu email. */
    email: string;
    hours: string;
    replyTime: string;
    nav: HomeNavValue[];
    footerDescription: string;
    footerColumns: { title: string; links: HomeLinkValue[] }[];
    copyright: string;
  };
  /**
   * Bengali and Hindi text, edited at Homepage → বাংলা / हिन्दी. Missing or
   * outdated entries fall back to the built-in translation, then to English
   * (see localizeHomeContent below).
   */
  translations: HomeTranslations;
}

export const HOME_META_DEFAULTS = {
  metaTitle: "Joy Maa Tara Bama Kripa — Site crews for bridges, metro and civil works",
  metaDescription:
    "Skilled and unskilled construction workers from West Bengal, fully registered, deployed fast and managed on site by our own supervisors. PF, ESIC and wage records every month.",
};

// ── Defaults (identical to the Figma page as it shipped) ─────────────────────

/** Slot photos default to "" so a `home-<slot>*` Media upload can still win. */
const slotImage = (slot: keyof typeof FALLBACK_IMAGES): HomeImageValue => ({
  src: "",
  alt: FALLBACK_IMAGES[slot].alt,
  focus: FALLBACK_IMAGES[slot].focus ?? "center",
});

const bundledImage = (img: { src: string; alt: string; focus?: ImageFocus }): HomeImageValue => ({
  src: img.src,
  alt: img.alt,
  focus: img.focus ?? "center",
});

const link = (label: string, href: string): HomeLinkValue => ({ label, href });

const faqGroup = (audience: FaqAudience): HomeFaqGroupValue => {
  const group = FAQ_GROUPS.find((g) => g.audience === audience);
  return {
    label: group?.label ?? "",
    items: (group?.items ?? []).map(({ question, answer }) => ({ question, answer })),
  };
};

export function defaultHomeContent(): HomePageContent {
  return {
    sectionOrder: [...HOME_SECTION_KEYS],
    hero: {
      enabled: true,
      eyebrow: FALLBACK_HERO.eyebrow,
      titleLead: FALLBACK_HERO.titleLead,
      titleAccent: FALLBACK_HERO.titleAccent,
      titleTail: FALLBACK_HERO.titleTail,
      subtitle: FALLBACK_HERO.subtitle,
      primaryCta: link(FALLBACK_HERO.primaryCta, "#contact"),
      secondaryCta: link(FALLBACK_HERO.secondaryCta, "#join-our-crew"),
      whatsappCta: FALLBACK_HERO.whatsappCta,
      trustPoints: FALLBACK_HERO.trustPoints.map((p) => ({ ...p })),
      image: slotImage("hero"),
    },
    services: {
      enabled: true,
      titleLead: "Site labour for every",
      titleAccent: "stage of your project",
      intro:
        "From the first pour to the monthly paperwork, one team handles your site labour, with our own supervisor on every crew.",
      cta: link("Request workers", "#contact"),
      cards: FALLBACK_SERVICES.map((s) => ({
        title: s.title,
        eyebrow: s.eyebrow ?? "",
        badge: s.badge ?? "",
        href: s.href ?? "",
        image: bundledImage(s.image),
      })),
    },
    sites: {
      enabled: true,
      title: "Crews for the toughest sites.",
      cards: SITE_TYPES.map((s) => ({
        title: s.title,
        description: s.description,
        href: "#contact",
        image: s.image ? bundledImage(s.image) : { src: "", alt: "", focus: "center" },
      })),
    },
    why: {
      enabled: true,
      titleLead: "Why contractors choose",
      titleAccent: "Joy Maa Tara",
      intro:
        "We only staff construction and infrastructure sites. One focus, one owner, and every paper in order.",
      badge: "Founder-led, on site",
      image: slotImage("why"),
      reasons: REASONS.map(({ title, description, tag }) => ({ title, description, tag })),
    },
    trades: {
      enabled: true,
      title: "The hands your site needs.",
      intro: "Pick a skill level. Every worker is ID-checked and inducted.",
      cards: TRADES.map((t) => ({ title: t.title, icon: t.icon, image: bundledImage(t.image) })),
    },
    process: {
      enabled: true,
      titleLead: "How we deploy your",
      titleAccent: "crew",
      intro: "A four-step process built for speed, safety and paperwork you can show an inspector.",
      steps: PROCESS_STEPS.map(({ icon, title, description, outcomeLabel, outcome }) => ({
        icon,
        title,
        description,
        outcomeLabel,
        outcome,
      })),
    },
    founder: {
      enabled: true,
      name: FOUNDER.name,
      initials: FOUNDER.initials,
      role: FOUNDER.role,
      heading: FOUNDER.heading,
      story: FOUNDER.story,
      ctaLabel: "Contact",
      image: slotImage("founder"),
      assurances: [...FOUNDER.assurances],
    },
    banner: {
      enabled: true,
      title: "A Strong Workforce for the stronger India",
      copy: "Dedicated crew to power your Project",
      cta: link("Our Team", "#trades"),
      image: slotImage("banner"),
    },
    faq: {
      enabled: true,
      title: "Frequently asked questions",
      intro: "Straight answers on crews, rates, pay and paperwork.",
      ownerRole: "Founder · answers calls himself",
      ownerTitle: "Still not sure? Talk to the owner.",
      ownerText: "Crew size, rates or timing. Get a straight answer before you send a request.",
      moreText: "Can't find your answer?",
      moreLink: link("Ask in the request form", "#contact"),
      companies: faqGroup("companies"),
      workers: faqGroup("workers"),
    },
    contact: {
      enabled: true,
      title: "Need a crew next week? Let's plan it today.",
      cardTitle: "Ready to build your crew?",
      cardText: "Send the site details. The owner calls you back.",
      labels: { ...CONTACT_LABELS },
      formTitle: "Send us your requirement",
      formText: "Fill in the details and we will get back to you within 24 hours.",
      form: { ...LEAD_FORM_COPY, labels: { ...LEAD_FORM_COPY.labels } },
      image: slotImage("contact"),
    },
    site: {
      brand: {
        name: FALLBACK_CHROME.brand.name,
        // Empty = the bundled logo, so a later logo redesign still shows.
        headerLogo: { src: "", alt: BRAND_LOGOS.header.alt, focus: "center" },
        footerLogo: { src: "", alt: BRAND_LOGOS.footer.alt, focus: "center" },
      },
      labels: {
        ...FALLBACK_CHROME.labels,
        whatsappDisplay: FALLBACK_CONTACT.whatsappDisplay,
      },
      languages: {
        enabled: true,
        items: FALLBACK_CHROME.languages.map((l) => ({ ...l, enabled: true })),
      },
      phone: "",
      whatsapp: "",
      email: "",
      hours: FALLBACK_CONTACT.hours,
      replyTime: FALLBACK_CONTACT.replyTime,
      nav: FALLBACK_CHROME.nav.map((n) => ({
        label: n.label,
        href: n.href ?? "",
        children: n.children.map((c) => link(c.label, c.href ?? "")),
      })),
      footerDescription: FALLBACK_CHROME.footerDescription,
      footerColumns: FALLBACK_CHROME.footerColumns.map((col) => ({
        title: col.title,
        links: col.links.map((l) => link(l.label, l.href ?? "")),
      })),
      copyright: FALLBACK_CHROME.copyright ?? "",
    },
    translations: { bn: {}, hi: {} },
  };
}

// ── Normalisation (sanitises anything read from or sent to the database) ────

const MAX_TEXT = 2000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Stored string if it is one (empty allowed — admins may blank a field), else the default. */
function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Stored array if it is one (empty allowed), each item normalised, capped. */
function list<T>(value: unknown, fallback: T[], max: number, item: (raw: unknown, index: number) => T): T[] {
  if (!Array.isArray(value)) return fallback;
  return value.slice(0, max).map(item);
}

/** True for URLs we are willing to put in an <img src>. */
export function isSafeImageSrc(src: string): boolean {
  return /^https?:\/\/[^\s"'<>]+$/i.test(src) || /^\/(?!\/)[^\s"'<>]*$/.test(src);
}

/** True for URLs we are willing to put in an <a href>. Blocks javascript: etc. */
export function isSafeHref(href: string): boolean {
  return (
    href.startsWith("#") ||
    /^\/(?!\/)/.test(href) ||
    /^https?:\/\/[^\s"'<>]+$/i.test(href) ||
    /^(mailto|tel):[^\s"'<>]+$/i.test(href)
  );
}

function href(value: unknown, fallback: string): string {
  const raw = str(value, fallback);
  return raw === "" || isSafeHref(raw) ? raw : fallback;
}

function image(value: unknown, fallback: HomeImageValue): HomeImageValue {
  const v = isRecord(value) ? value : {};
  const src = str(v.src, fallback.src);
  return {
    src: src === "" || isSafeImageSrc(src) ? src : fallback.src,
    alt: str(v.alt, fallback.alt),
    focus: oneOf(v.focus, IMAGE_FOCUS_OPTIONS, fallback.focus),
  };
}

function linkValue(value: unknown, fallback: HomeLinkValue): HomeLinkValue {
  const v = isRecord(value) ? value : {};
  return { label: str(v.label, fallback.label), href: href(v.href, fallback.href) };
}

const EMPTY_IMAGE: HomeImageValue = { src: "", alt: "", focus: "center" };

/** Known section keys in the stored order, without repeats; missing ones are appended. */
function sectionOrder(value: unknown, fallback: HomeSectionKey[]): HomeSectionKey[] {
  if (!Array.isArray(value)) return fallback;
  const known = new Set<string>(HOME_SECTION_KEYS);
  const order: HomeSectionKey[] = [];
  for (const key of value) {
    if (typeof key === "string" && known.has(key) && !order.includes(key as HomeSectionKey)) {
      order.push(key as HomeSectionKey);
    }
  }
  for (const key of HOME_SECTION_KEYS) if (!order.includes(key)) order.push(key);
  return order;
}

/** One entry per supported language, in the stored order; unknown codes are dropped. */
function languageItems(value: unknown, fallback: HomeLanguageValue[]): HomeLanguageValue[] {
  if (!Array.isArray(value)) return fallback;
  const items: HomeLanguageValue[] = [];
  for (const raw of value) {
    const i = isRecord(raw) ? raw : {};
    const base = fallback.find((f) => f.code === i.code);
    if (!base || items.some((item) => item.code === base.code)) continue;
    items.push({
      code: base.code,
      label: str(i.label, base.label) || base.label,
      name: str(i.name, base.name) || base.name,
      enabled: bool(i.enabled, true),
    });
  }
  for (const base of fallback) if (!items.some((item) => item.code === base.code)) items.push(base);
  return items;
}
const EMPTY_LINK: HomeLinkValue = { label: "", href: "" };

/** Deep-merges stored JSON over the defaults and drops anything unknown or unsafe. */
export function normalizeHomeContent(raw: unknown): HomePageContent {
  const d = defaultHomeContent();
  const c = isRecord(raw) ? raw : {};
  const sec = (key: keyof HomePageContent) => (isRecord(c[key]) ? (c[key] as Record<string, unknown>) : {});

  const hero = sec("hero");
  const services = sec("services");
  const sites = sec("sites");
  const why = sec("why");
  const trades = sec("trades");
  const process = sec("process");
  const founder = sec("founder");
  const banner = sec("banner");
  const faq = sec("faq");
  const contact = sec("contact");
  const site = sec("site");

  const faqGroupValue = (value: unknown, fallback: HomeFaqGroupValue): HomeFaqGroupValue => {
    const g = isRecord(value) ? value : {};
    return {
      label: str(g.label, fallback.label),
      items: list(g.items, fallback.items, HOME_LIMITS.faqItems, (item) => {
        const i = isRecord(item) ? item : {};
        return { question: str(i.question, ""), answer: str(i.answer, "") };
      }),
    };
  };

  const contactLabels = isRecord(contact.labels) ? contact.labels : {};
  const form = isRecord(contact.form) ? contact.form : {};
  const formLabels = isRecord(form.labels) ? form.labels : {};
  const brand = isRecord(site.brand) ? site.brand : {};
  const siteLabels = isRecord(site.labels) ? site.labels : {};
  const languages = isRecord(site.languages) ? site.languages : {};
  const translations = isRecord(c.translations) ? c.translations : {};

  return {
    sectionOrder: sectionOrder(c.sectionOrder, d.sectionOrder),
    hero: {
      enabled: bool(hero.enabled, d.hero.enabled),
      eyebrow: str(hero.eyebrow, d.hero.eyebrow),
      titleLead: str(hero.titleLead, d.hero.titleLead),
      titleAccent: str(hero.titleAccent, d.hero.titleAccent),
      titleTail: str(hero.titleTail, d.hero.titleTail),
      subtitle: str(hero.subtitle, d.hero.subtitle),
      primaryCta: linkValue(hero.primaryCta, d.hero.primaryCta),
      secondaryCta: linkValue(hero.secondaryCta, d.hero.secondaryCta),
      whatsappCta: str(hero.whatsappCta, d.hero.whatsappCta),
      trustPoints: list(hero.trustPoints, d.hero.trustPoints, HOME_LIMITS.trustPoints, (item) => {
        const i = isRecord(item) ? item : {};
        return { icon: oneOf(i.icon, HERO_ICONS, "verified"), label: str(i.label, "") };
      }),
      image: image(hero.image, d.hero.image),
    },
    services: {
      enabled: bool(services.enabled, d.services.enabled),
      titleLead: str(services.titleLead, d.services.titleLead),
      titleAccent: str(services.titleAccent, d.services.titleAccent),
      intro: str(services.intro, d.services.intro),
      cta: linkValue(services.cta, d.services.cta),
      cards: list(services.cards, d.services.cards, HOME_LIMITS.services, (item) => {
        const i = isRecord(item) ? item : {};
        return {
          title: str(i.title, ""),
          eyebrow: str(i.eyebrow, ""),
          badge: str(i.badge, ""),
          href: href(i.href, ""),
          image: image(i.image, EMPTY_IMAGE),
        };
      }),
    },
    sites: {
      enabled: bool(sites.enabled, d.sites.enabled),
      title: str(sites.title, d.sites.title),
      cards: list(sites.cards, d.sites.cards, HOME_LIMITS.sites, (item) => {
        const i = isRecord(item) ? item : {};
        return {
          title: str(i.title, ""),
          description: str(i.description, ""),
          // Cards saved before links existed keep pointing at the form.
          href: href(i.href, "#contact"),
          image: image(i.image, EMPTY_IMAGE),
        };
      }),
    },
    why: {
      enabled: bool(why.enabled, d.why.enabled),
      titleLead: str(why.titleLead, d.why.titleLead),
      titleAccent: str(why.titleAccent, d.why.titleAccent),
      intro: str(why.intro, d.why.intro),
      badge: str(why.badge, d.why.badge),
      image: image(why.image, d.why.image),
      reasons: list(why.reasons, d.why.reasons, HOME_LIMITS.reasons, (item) => {
        const i = isRecord(item) ? item : {};
        return { title: str(i.title, ""), description: str(i.description, ""), tag: str(i.tag, "") };
      }),
    },
    trades: {
      enabled: bool(trades.enabled, d.trades.enabled),
      title: str(trades.title, d.trades.title),
      intro: str(trades.intro, d.trades.intro),
      cards: list(trades.cards, d.trades.cards, HOME_LIMITS.trades, (item) => {
        const i = isRecord(item) ? item : {};
        return {
          title: str(i.title, ""),
          icon: oneOf(i.icon, TRADE_ICONS, "helpers"),
          image: image(i.image, EMPTY_IMAGE),
        };
      }),
    },
    process: {
      enabled: bool(process.enabled, d.process.enabled),
      titleLead: str(process.titleLead, d.process.titleLead),
      titleAccent: str(process.titleAccent, d.process.titleAccent),
      intro: str(process.intro, d.process.intro),
      steps: list(process.steps, d.process.steps, HOME_LIMITS.steps, (item) => {
        const i = isRecord(item) ? item : {};
        return {
          icon: oneOf(i.icon, PROCESS_ICONS, "requirement"),
          title: str(i.title, ""),
          description: str(i.description, ""),
          outcomeLabel: str(i.outcomeLabel, ""),
          outcome: str(i.outcome, ""),
        };
      }),
    },
    founder: {
      enabled: bool(founder.enabled, d.founder.enabled),
      name: str(founder.name, d.founder.name),
      initials: str(founder.initials, d.founder.initials).slice(0, 3),
      role: str(founder.role, d.founder.role),
      heading: str(founder.heading, d.founder.heading),
      story: str(founder.story, d.founder.story),
      ctaLabel: str(founder.ctaLabel, d.founder.ctaLabel),
      image: image(founder.image, d.founder.image),
      assurances: list(founder.assurances, d.founder.assurances, HOME_LIMITS.assurances, (item) => str(item, "")),
    },
    banner: {
      enabled: bool(banner.enabled, d.banner.enabled),
      title: str(banner.title, d.banner.title),
      copy: str(banner.copy, d.banner.copy),
      cta: linkValue(banner.cta, d.banner.cta),
      image: image(banner.image, d.banner.image),
    },
    faq: {
      enabled: bool(faq.enabled, d.faq.enabled),
      title: str(faq.title, d.faq.title),
      intro: str(faq.intro, d.faq.intro),
      ownerRole: str(faq.ownerRole, d.faq.ownerRole),
      ownerTitle: str(faq.ownerTitle, d.faq.ownerTitle),
      ownerText: str(faq.ownerText, d.faq.ownerText),
      moreText: str(faq.moreText, d.faq.moreText),
      moreLink: linkValue(faq.moreLink, d.faq.moreLink),
      companies: faqGroupValue(faq.companies, d.faq.companies),
      workers: faqGroupValue(faq.workers, d.faq.workers),
    },
    contact: {
      enabled: bool(contact.enabled, d.contact.enabled),
      title: str(contact.title, d.contact.title),
      cardTitle: str(contact.cardTitle, d.contact.cardTitle),
      cardText: str(contact.cardText, d.contact.cardText),
      labels: {
        call: str(contactLabels.call, d.contact.labels.call),
        whatsapp: str(contactLabels.whatsapp, d.contact.labels.whatsapp),
        whatsappValue: str(contactLabels.whatsappValue, d.contact.labels.whatsappValue),
        reply: str(contactLabels.reply, d.contact.labels.reply),
      },
      formTitle: str(contact.formTitle, d.contact.formTitle),
      formText: str(contact.formText, d.contact.formText),
      form: {
        labels: Object.fromEntries(
          LEAD_FIELDS.map((field) => [field, str(formLabels[field], d.contact.form.labels[field])]),
        ) as Record<LeadField, string>,
        optionalHint: str(form.optionalHint, d.contact.form.optionalHint),
        submit: str(form.submit, d.contact.form.submit),
        submitting: str(form.submitting, d.contact.form.submitting),
        successTitle: str(form.successTitle, d.contact.form.successTitle),
        successText: str(form.successText, d.contact.form.successText),
        resetLabel: str(form.resetLabel, d.contact.form.resetLabel),
        invalidText: str(form.invalidText, d.contact.form.invalidText),
        errorText: str(form.errorText, d.contact.form.errorText),
      },
      image: image(contact.image, d.contact.image),
    },
    site: {
      brand: {
        name: str(brand.name, d.site.brand.name),
        headerLogo: image(brand.headerLogo, d.site.brand.headerLogo),
        footerLogo: image(brand.footerLogo, d.site.brand.footerLogo),
      },
      labels: {
        callButton: str(siteLabels.callButton, d.site.labels.callButton),
        whatsappButton: str(siteLabels.whatsappButton, d.site.labels.whatsappButton),
        whatsappDisplay: str(siteLabels.whatsappDisplay, d.site.labels.whatsappDisplay),
        footerContactTitle: str(siteLabels.footerContactTitle, d.site.labels.footerContactTitle),
      },
      languages: {
        enabled: bool(languages.enabled, d.site.languages.enabled),
        items: languageItems(languages.items, d.site.languages.items),
      },
      phone: str(site.phone, d.site.phone),
      whatsapp: str(site.whatsapp, d.site.whatsapp),
      email: str(site.email, d.site.email),
      hours: str(site.hours, d.site.hours),
      replyTime: str(site.replyTime, d.site.replyTime),
      nav: list(site.nav, d.site.nav, HOME_LIMITS.nav, (item) => {
        const i = isRecord(item) ? item : {};
        return {
          ...linkValue(i, EMPTY_LINK),
          children: list(i.children, [], HOME_LIMITS.navChildren, (child) => linkValue(child, EMPTY_LINK)),
        };
      }),
      footerDescription: str(site.footerDescription, d.site.footerDescription),
      footerColumns: list(site.footerColumns, d.site.footerColumns, HOME_LIMITS.footerColumns, (item) => {
        const i = isRecord(item) ? item : {};
        return {
          title: str(i.title, ""),
          links: list(i.links, [], HOME_LIMITS.footerLinks, (l) => linkValue(l, EMPTY_LINK)),
        };
      }),
      copyright: str(site.copyright, d.site.copyright),
    },
    translations: {
      bn: translationEntries(translations.bn),
      hi: translationEntries(translations.hi),
    },
  };
}

/** Fallback preview/alt for the five slot photos (editor previews + public fallback). */
export const HOME_SLOT_DEFAULTS = FALLBACK_IMAGES;

// ── Translations (Bengali / Hindi) ───────────────────────────────────────────
//
// The page is written in English; each other language is a flat map from a
// field's path ("hero.titleLead", "faq.companies.items.0.question", plus
// "meta.title" / "meta.description") to its translation. Each entry also keeps
// the English it was translated from, and is only used while that English is
// unchanged — after an edit, or when list items move, the field falls back to
// a still-matching built-in translation or to English, never to text that
// belongs to another field.

/** Languages the page content can be translated into (English is the source). */
export const TRANSLATED_LANGUAGES = ["bn", "hi"] as const;
export type TranslatedLanguage = (typeof TRANSLATED_LANGUAGES)[number];

export interface HomeTranslation {
  /** The English text this was translated from. */
  source: string;
  text: string;
}

export type HomeTranslations = Record<TranslatedLanguage, Record<string, HomeTranslation>>;

export const META_TRANSLATION_PATHS = { title: "meta.title", description: "meta.description" } as const;

/** Keys that hold links, images, switches or codes — never visible copy. */
const NON_TEXT_KEYS = new Set([
  "href",
  "src",
  "focus",
  "icon",
  "enabled",
  "initials",
  "code",
  "sectionOrder",
  "translations",
]);

/** Fields that stay as written in every language: names, numbers, switcher labels. */
const NON_TEXT_PATHS = new Set([
  "founder.name",
  "site.brand.name",
  "site.languages",
  "site.phone",
  "site.whatsapp",
  "site.email",
  "site.labels.whatsappDisplay",
]);

const TRANSLATION_PATH = /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+){1,6}$/;
const MAX_TRANSLATIONS = 1500;

function isTranslatablePath(path: string): boolean {
  if (path === META_TRANSLATION_PATHS.title || path === META_TRANSLATION_PATHS.description) return true;
  if (!TRANSLATION_PATH.test(path)) return false;
  const parts = path.split(".");
  return !parts.some(
    (part, i) => NON_TEXT_KEYS.has(part) || NON_TEXT_PATHS.has(parts.slice(0, i + 1).join(".")),
  );
}

function translationEntries(value: unknown): Record<string, HomeTranslation> {
  const out: Record<string, HomeTranslation> = {};
  if (!isRecord(value)) return out;
  let count = 0;
  for (const [path, raw] of Object.entries(value)) {
    if (count >= MAX_TRANSLATIONS) break;
    if (!isTranslatablePath(path) || !isRecord(raw)) continue;
    const source = str(raw.source, "");
    const text = str(raw.text, "");
    if (!source || !text) continue;
    out[path] = { source, text };
    count += 1;
  }
  return out;
}

/** Every non-empty visible text field of the page as [path, English], top to bottom. */
export function translatableEntries(content: HomePageContent): [path: string, english: string][] {
  const out: [string, string][] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (value) out.push([path, value]);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}.${index}`));
    } else if (isRecord(value)) {
      for (const [key, child] of Object.entries(value)) {
        const childPath = path ? `${path}.${key}` : key;
        if (!NON_TEXT_KEYS.has(key) && !NON_TEXT_PATHS.has(childPath)) walk(child, childPath);
      }
    }
  };
  walk(content, "");
  return out;
}

/** The built-in translation of an English string, if there is one. */
export function seedTranslation(lang: TranslatedLanguage, english: string): string | undefined {
  return SEED_TRANSLATIONS[lang][english];
}

/**
 * One field in `lang`: the CMS translation while it still matches the
 * English, else the built-in translation, else the English itself.
 */
export function getLocalizedField(lang: SwitcherLanguage, english: string, saved?: HomeTranslation): string {
  if (lang === "en" || !english) return english;
  if (saved && saved.source === english && saved.text) return saved.text;
  return seedTranslation(lang, english) ?? english;
}

function setAtPath(target: unknown, path: string, value: string): void {
  const parts = path.split(".");
  let node: unknown = target;
  for (const part of parts.slice(0, -1)) {
    if (typeof node !== "object" || node === null) return;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node === "object" && node !== null) {
    (node as Record<string, unknown>)[parts[parts.length - 1]] = value;
  }
}

/**
 * The page content with every visible text field in `lang`. Structure (order,
 * switches, links, images, list lengths) always stays the English page's.
 */
export function localizeHomeContent(content: HomePageContent, lang: SwitcherLanguage): HomePageContent {
  if (lang === "en") return content;
  const saved = content.translations[lang];
  const out = structuredClone(content);
  for (const [path, english] of translatableEntries(content)) {
    setAtPath(out, path, getLocalizedField(lang, english, saved[path]));
  }
  return out;
}

/** Meta title/description in `lang`; blank English falls back to HOME_META_DEFAULTS. */
export function localizeMeta(
  content: HomePageContent,
  lang: SwitcherLanguage,
  meta: { title: string | null; description: string | null },
): { title: string | null; description: string | null } {
  if (lang === "en") return meta;
  const saved = content.translations[lang];
  return {
    title: getLocalizedField(lang, meta.title ?? HOME_META_DEFAULTS.metaTitle, saved[META_TRANSLATION_PATHS.title]),
    description: getLocalizedField(
      lang,
      meta.description ?? HOME_META_DEFAULTS.metaDescription,
      saved[META_TRANSLATION_PATHS.description],
    ),
  };
}
