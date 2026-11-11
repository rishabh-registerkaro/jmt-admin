// SHARED FILE — an identical copy lives in jmt-admin/types/homepage.ts and
// jmt-frontend/types/homepage.ts. Change both together.
//
// View-model types for the public homepage.
//
// Components only ever see these shapes — never raw Prisma rows or JSON blobs.
// `server/homepage.ts` maps CMS records into them, and
// `data/homepageFallback.ts` provides Figma-accurate defaults with the same shape.

/** Where a homepage image comes from: a bundled asset or a CMS media URL. */
export interface HomeImage {
  src: string;
  alt: string;
  /** Intrinsic size, used by next/image for aspect ratio and layout. */
  width: number;
  height: number;
  /** Which part of the photo to keep visible when it is cropped. */
  focus?: ImageFocus;
}

export type ImageFocus = "center" | "top" | "upper" | "left" | "right";

/** A link target that may not exist (e.g. a service page with no public URL). */
export type Href = string | null;

// ── Navigation ───────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  /** Null for a pure dropdown parent whose CMS url has no public target. */
  href: Href;
  children: NavChildLink[];
}

export interface NavChildLink {
  label: string;
  /** Null renders the entry as plain text (e.g. a branch office name). */
  href: Href;
}

export interface FooterColumn {
  title: string;
  links: NavChildLink[];
}

/** Phone, WhatsApp and email details shared by navbar, CTAs and footer. */
export interface ContactInfo {
  phoneDisplay: string;
  /** `tel:` URL, or null while the number is still a placeholder. */
  phoneHref: Href;
  whatsappDisplay: string;
  /** `https://wa.me/…` URL, or null while the number is still a placeholder. */
  whatsappHref: Href;
  emailDisplay: string;
  emailHref: Href;
  hours: string;
  replyTime: string;
}

/** Logos and the brand name used for the home links (screen-reader label). */
export interface BrandContent {
  name: string;
  headerLogo: HomeImage;
  footerLogo: HomeImage;
}

/** Button and heading labels that repeat across the navbar, FAQ and footer. */
export interface ChromeLabels {
  /** Navbar and FAQ owner card call button. */
  callButton: string;
  /** FAQ owner card WhatsApp button. */
  whatsappButton: string;
  /** Heading of the footer column that lists phone, WhatsApp, email and hours. */
  footerContactTitle: string;
}

/**
 * Languages the homepage is published in: English at "/", Bengali at "/bn",
 * Hindi at "/hi". Bengali/Hindi text comes from HomePageContent.translations
 * (app/lib/content/home-content.ts).
 */
export const SWITCHER_LANGUAGES = ["en", "bn", "hi"] as const;
export type SwitcherLanguage = (typeof SWITCHER_LANGUAGES)[number];

export function isSwitcherLanguage(value: unknown): value is SwitcherLanguage {
  return typeof value === "string" && (SWITCHER_LANGUAGES as readonly string[]).includes(value);
}

export interface LanguageOption {
  code: SwitcherLanguage;
  /** Short label shown in the switcher, e.g. "EN" or "বাং". */
  label: string;
  /** Full name, e.g. "বাংলা (Bengali)" (tooltip and screen readers). */
  name: string;
}

export interface SiteChrome {
  brand: BrandContent;
  labels: ChromeLabels;
  /** Empty when the admin has switched the language switcher off. */
  languages: LanguageOption[];
  nav: NavLink[];
  footerColumns: FooterColumn[];
  footerDescription: string;
  copyright: string | null;
  contact: ContactInfo;
}

// ── Sections ─────────────────────────────────────────────────────────────────

export interface HeroContent {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  titleTail: string;
  subtitle: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  whatsappCta: string;
  trustPoints: { icon: HeroTrustIcon; label: string }[];
  image: HomeImage;
}

export type HeroTrustIcon = "verified" | "fast" | "support";

export interface ServiceCard {
  id: string;
  title: string;
  eyebrow: string | null;
  badge: string | null;
  href: Href;
  image: HomeImage;
}

export interface SiteTypeCard {
  id: string;
  title: string;
  description: string;
  /** Where the card links to; null makes the card plain (not clickable). */
  href: Href;
  image: HomeImage | null;
}

export interface ReasonItem {
  number: string;
  title: string;
  description: string;
  tag: string;
}

export interface TradeCard {
  id: string;
  title: string;
  icon: TradeIcon;
  image: HomeImage;
}

export type TradeIcon = "masonry" | "shuttering" | "welding" | "helpers";

export interface ProcessStep {
  number: string;
  icon: ProcessIcon;
  title: string;
  description: string;
  outcomeLabel: string;
  outcome: string;
}

export type ProcessIcon = "requirement" | "site-visit" | "crew" | "records";

export interface FounderContent {
  name: string;
  initials: string;
  role: string;
  heading: string;
  story: string;
  image: HomeImage;
  assurances: string[];
  /** Label on the call button beside the founder's name. */
  ctaLabel: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type FaqAudience = "companies" | "workers";

export interface FaqGroup {
  audience: FaqAudience;
  label: string;
  items: FaqItem[];
}

// ── Section copy (headings, intros and CTAs edited in the admin) ────────────

export interface CtaLink {
  label: string;
  href: string;
}

/** A heading whose second part is rendered in the accent colour. */
export interface AccentHeading {
  lead: string;
  accent: string;
}

export interface ServicesCopy {
  heading: AccentHeading;
  intro: string;
  cta: CtaLink;
}

export interface SitesCopy {
  title: string;
}

export interface WhyCopy {
  heading: AccentHeading;
  intro: string;
  badge: string;
}

export interface TradesCopy {
  title: string;
  intro: string;
}

export interface ProcessCopy {
  heading: AccentHeading;
  intro: string;
}

export interface BannerContent {
  title: string;
  copy: string;
  cta: CtaLink;
  image: HomeImage;
}

export interface FaqCopy {
  title: string;
  intro: string;
  ownerRole: string;
  ownerTitle: string;
  ownerText: string;
  moreText: string;
  moreLink: CtaLink;
}

export interface ContactCopy {
  title: string;
  cardTitle: string;
  cardText: string;
  /** Small uppercase labels on the contact card rows. */
  labels: {
    call: string;
    whatsapp: string;
    /** Text shown under the WhatsApp label (e.g. "Chat with us"). */
    whatsappValue: string;
    reply: string;
  };
  formTitle: string;
  formText: string;
  form: LeadFormCopy;
}

/** Every piece of text in the "Request workers" form. */
export interface LeadFormCopy {
  labels: Record<LeadField, string>;
  /** Appended to the label of optional fields, e.g. "(optional)". */
  optionalHint: string;
  submit: string;
  /** Button text while the request is being sent. */
  submitting: string;
  successTitle: string;
  successText: string;
  /** Button that brings the form back after a successful request. */
  resetLabel: string;
  /** Shown above the button when some fields are invalid. */
  invalidText: string;
  /** Shown when the request could not be sent at all. */
  errorText: string;
}

export type HomepageSection =
  | "hero"
  | "services"
  | "sites"
  | "why"
  | "trades"
  | "process"
  | "founder"
  | "banner"
  | "faq"
  | "contact";

/** Everything jmt-frontend `app/(public)/page.tsx` needs, resolved in one call. */
export interface HomepageData {
  /** Sections switched off in the admin are not rendered. */
  enabled: Record<HomepageSection, boolean>;
  /** Every section, top to bottom, in the order chosen in the admin. */
  order: HomepageSection[];
  /** SEO title/description from the admin; null means use the built-in defaults. */
  meta: { title: string | null; description: string | null };
  hero: HeroContent;
  services: ServiceCard[];
  servicesCopy: ServicesCopy;
  siteTypes: SiteTypeCard[];
  sitesCopy: SitesCopy;
  reasons: ReasonItem[];
  reasonsImage: HomeImage;
  whyCopy: WhyCopy;
  trades: TradeCard[];
  tradesCopy: TradesCopy;
  process: ProcessStep[];
  processCopy: ProcessCopy;
  founder: FounderContent;
  banner: BannerContent;
  faqs: FaqGroup[];
  faqCopy: FaqCopy;
  contactImage: HomeImage;
  contactCopy: ContactCopy;
}

// ── Lead capture ─────────────────────────────────────────────────────────────

export const LEAD_FIELDS = [
  "companyName",
  "name",
  "phone",
  "siteLocation",
  "headcount",
  "startDate",
] as const;

export type LeadField = (typeof LEAD_FIELDS)[number];

export type LeadFormValues = Record<LeadField, string>;

export interface LeadFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<LeadField, string>>;
  /** Echoed back on error so the visitor doesn't retype the form. */
  values: LeadFormValues;
}
