// Shared content model for service/division pages.
//
// This mirrors the frontend's `ServiceConfig` type
// (JMT/app/components/divisions/servicelayout/types.ts) with one
// difference: icons are stored as string names (e.g. "Plane") instead of React
// components, so the whole page can live in a single JSON column. The frontend
// resolves names back to components via its divisions/icons exports.
//
// Adding a new field or a new section kind here requires NO database
// migration — the page is stored as one `content` Json document.

// Icon names exported by JMT/app/components/divisions/icons.tsx
export const ICON_NAMES = [
  "ArrowRight",
  "BadgeCheck",
  "BarChart",
  "BedDouble",
  "Bot",
  "Briefcase",
  "Check",
  "ChevronDown",
  "ChevronRight",
  "Compass",
  "Cpu",
  "Globe",
  "GraduationCap",
  "Headset",
  "MapPin",
  "Megaphone",
  "Network",
  "Plane",
  "Plus",
  "Rocket",
  "ShieldCheck",
  "Sparkles",
  "Target",
  "Users",
] as const;

export type IconName = (typeof ICON_NAMES)[number] | (string & {});

export type Breadcrumb = { label: string; href?: string };

export type HeroChip = { icon: IconName; title: string; sub: string };

type SectionBase = {
  /** Anchor id used for in-page links / table of contents */
  id: string;
  /** Label shown in the sticky table of contents */
  label: string;
  /** Heading rendered at the top of the section */
  heading: string;
};

export type IntroSection = SectionBase & {
  kind: "intro";
  paragraphs: string[];
  stats?: { icon: IconName; value: string; label: string }[];
};

export type CardsSection = SectionBase & {
  kind: "cards";
  intro?: string;
  cards: { icon: IconName; title: string; points: string[] }[];
};

export type ChipsSection = SectionBase & {
  kind: "chips";
  intro?: string;
  chipIcon: IconName;
  chips: string[];
  note?: string;
};

export type StepsSection = SectionBase & {
  kind: "steps";
  intro?: string;
  // day/details/note are optional extras used by detail-style pages
  // (e.g. the apostille service) — division pages use only title + text.
  steps: {
    title: string;
    text: string;
    day?: string;
    details?: string[];
    note?: string;
  }[];
};

export type ChecklistSection = SectionBase & {
  kind: "checklist";
  intro?: string;
  items: string[];
};

export type FaqSection = SectionBase & {
  kind: "faq";
  intro?: string;
  faqs: { q: string; a: string }[];
};

export type TableSection = SectionBase & {
  kind: "table";
  intro?: string;
  columns: string[];
  rows: string[][];
};

export type NotesSection = SectionBase & {
  kind: "notes";
  intro?: string;
  notes: { title: string; body: string }[];
};

export type Section =
  | IntroSection
  | CardsSection
  | ChipsSection
  | StepsSection
  | ChecklistSection
  | FaqSection
  | TableSection
  | NotesSection;

export type SectionKind = Section["kind"];

/**
 * The full page document stored in `service_pages.content`.
 * Field-for-field compatible with the frontend `ServiceConfig` (icons as
 * strings). `sections` is an ordered list — add / remove / reorder freely.
 */
export type ServicePageContent = {
  breadcrumb: Breadcrumb[];
  badge: string;
  badgeIcon: IconName;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  chips: HeroChip[];
  formTitle: string;
  formSubtitle: string;
  formCountries?: string[];
  formCountryLabel?: string;
  helpPhone?: string;
  sections: Section[];
};

export const SECTION_KIND_LABELS: Record<SectionKind, string> = {
  intro: "Intro (paragraphs + stats)",
  cards: "Cards (icon + title + points)",
  chips: "Chips (tag list)",
  steps: "Steps (how it works)",
  checklist: "Checklist (why choose us)",
  faq: "FAQs",
  table: "Table (columns + rows)",
  notes: "Notes (title + body blocks)",
};

/** Blank section of the given kind, used by the admin "Add section" button. */
export function createSection(kind: SectionKind): Section {
  const base = { id: "", label: "", heading: "" };
  switch (kind) {
    case "intro":
      return { ...base, kind, paragraphs: [""], stats: [] };
    case "cards":
      return { ...base, kind, intro: "", cards: [] };
    case "chips":
      return { ...base, kind, intro: "", chipIcon: "MapPin", chips: [], note: "" };
    case "steps":
      return { ...base, kind, intro: "", steps: [] };
    case "checklist":
      return { ...base, kind, intro: "", items: [] };
    case "faq":
      return { ...base, kind, intro: "", faqs: [] };
    case "table":
      return { ...base, kind, intro: "", columns: [""], rows: [] };
    case "notes":
      return { ...base, kind, intro: "", notes: [] };
  }
}

export function emptyServicePageContent(): ServicePageContent {
  return {
    breadcrumb: [{ label: "Home", href: "/" }, { label: "" }],
    badge: "",
    badgeIcon: "Globe",
    titleLead: "",
    titleAccent: "",
    subtitle: "",
    chips: [],
    formTitle: "Enquire now",
    formSubtitle: "",
    formCountries: [],
    formCountryLabel: "",
    helpPhone: "",
    sections: [],
  };
}
