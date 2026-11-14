// View-model types for a public service page (app/service/…).
// Content lives in data/services/*; components only ever see these shapes.

import type { AccentHeading, HomeImage } from "@/types/homepage";

/** Eyebrow + heading (accent part underlined in orange) + short aside. */
export interface ServiceSectionCopy {
  eyebrow: string;
  heading: AccentHeading & { tail?: string };
  intro?: string;
}

export type ServiceFactIcon = "users" | "clock" | "moon" | "refresh";

export interface ServiceHeroContent {
  breadcrumb: { home: string; services: string; current: string };
  tag: string;
  title: AccentHeading & { tail: string };
  subtitle: string;
  primaryCta: string;
  whatsappCta: string;
  image: HomeImage;
  facts: { icon: ServiceFactIcon; label: string; value: string }[];
}

export interface ServiceSubnavLink {
  /** Id of the section the link scrolls to. */
  id: string;
  label: string;
}

export interface UseCaseCard {
  title: string;
  text: string;
  image: HomeImage;
}

export type IncludedChipIcon = "check" | "shield";

export interface IncludedContent {
  copy: ServiceSectionCopy;
  image: HomeImage;
  chips: { icon: IncludedChipIcon; label: string }[];
  provides: { badge: string; title: string; items: string[] };
  yours: { badge: string; title: string; items: string[]; agreed: { label: string; text: string } };
}

export interface RoleOption {
  id: string;
  name: string;
  level: string;
}

export interface TradeGroup {
  id: string;
  name: string;
  image: HomeImage;
  roles: RoleOption[];
}

export interface RolesContent {
  copy: ServiceSectionCopy;
  trades: TradeGroup[];
  /** Roles ticked when the page loads (design shows Mason + Bar bender). */
  preselected: string[];
  /** "{n} roles selected: {list}" — {n} and {list} are filled in. */
  summary: string;
  /** Shorter phone version of `summary`, e.g. "{n} selected: {list}". */
  summaryShort: string;
  emptySummary: string;
  continueCta: string;
  /** Phone label of the continue button. */
  continueShort: string;
}

export type CheckIcon = "hammer" | "id" | "info" | "hat" | "user";

export interface CrewContent {
  copy: ServiceSectionCopy;
  checks: { icon: CheckIcon; label: string; title: string; text: string }[];
  clearedLabel: string;
  sample: {
    image: HomeImage;
    caption: string;
    kicker: string;
    title: string;
    stamp: string;
    columns: { worker: string; trade: string; checks: string[] };
    /** Phone table header over the tick column, e.g. "Skill · ID · Ind · PPE". */
    checksShort: string;
    workers: { name: string; trade: string }[];
    lead: { title: string; duties: string };
    cta: string;
    note: string;
  };
}

export interface PlanCard {
  name: string;
  duration: string;
  /** Highlight pill on the photo, e.g. "Start here". */
  highlight?: string;
  suits: string;
  how: string;
  image: HomeImage;
}

export interface PlansContent {
  copy: ServiceSectionCopy;
  labels: { suits: string; how: string; rate: string };
  plans: PlanCard[];
}

export interface StepCard {
  timing: string;
  title: string;
  text: string;
  image: HomeImage;
}

export interface ServiceFaqContent {
  copy: ServiceSectionCopy;
  card: {
    image: HomeImage;
    kicker: string;
    title: string;
    role: string;
    call: string;
    whatsapp: string;
  };
  items: { id: string; question: string; answer: string }[];
}

export interface RelatedService {
  kicker: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image: HomeImage;
}

/** Page sections an admin can hide. Hero, subnav and the contact form (every
 *  "Request" button scrolls to it) are always shown. */
export const SERVICE_SECTION_KEYS = [
  "useCases",
  "included",
  "roles",
  "crew",
  "plans",
  "steps",
  "faq",
  "related",
] as const;
export type ServiceSectionKey = (typeof SERVICE_SECTION_KEYS)[number];

/** Anchor id each section renders with (subnav links point at these). */
export const SERVICE_SECTION_IDS: Record<ServiceSectionKey, string> = {
  useCases: "overview",
  included: "included",
  roles: "roles",
  crew: "your-crew",
  plans: "plans",
  steps: "how-it-works",
  faq: "faq",
  related: "related",
};

export interface ServicePageContent {
  slug: string;
  /** Section on/off switches set in the admin (missing = shown). */
  visible: Record<ServiceSectionKey, boolean>;
  meta: { title: string; description: string };
  hero: ServiceHeroContent;
  subnav: { links: ServiceSubnavLink[]; cta: string };
  useCases: { copy: ServiceSectionCopy; cards: UseCaseCard[] };
  included: IncludedContent;
  roles: RolesContent;
  crew: CrewContent;
  plans: PlansContent;
  steps: { copy: ServiceSectionCopy; steps: StepCard[] };
  faq: ServiceFaqContent;
  related: { copy: ServiceSectionCopy; services: RelatedService[] };
  /** Heading above the shared contact block (components/homepage/Contact). */
  contactTitle: string;
}
