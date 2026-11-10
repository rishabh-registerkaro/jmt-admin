// Shared content model for package blocks.
//
// A package block is NOT a page — it is a chunk of content that gets injected
// into other pages. Each block names the page slugs it belongs to
// (`PackageBlock.targetPages`), and the frontend pulls whatever block targets
// the page it is rendering, dropping it in after the 2nd content section.
//
// This mirrors the frontend's tour-packages component
// (JMT/app/components/tourpackages/) with two differences, both so the
// whole block can live in a single JSON column:
//   • icons are stored as string keys ("palmtree") instead of React components
//   • card gradients are stored as band keys ("gold") instead of raw CSS
// The frontend resolves both back at render time.
//
// Adding a field here requires NO database migration — the block is one
// `content` Json document.

/** Icon keys exported by JMT/app/components/tourpackages/icons.tsx */
export const PACKAGE_ICON_NAMES = [
  // travel
  "plane",
  "building-2",
  "palmtree",
  "ferris-wheel",
  "waves",
  "mountain-snow",
  "sailboat",
  "landmark",
  "tent",
  "users",
  "bed-double",
  "utensils",
  // business / marketing — the same block is used on non-travel service pages
  "target",
  "bar-chart",
  "rocket",
  "megaphone",
  "bot",
  "cpu",
  "briefcase",
  "globe",
  "shield-check",
  "clock",
] as const;

/** Icon keys that read well on a small stat tile */
export const PACKAGE_STAT_ICON_NAMES = [
  "users",
  "bed-double",
  "utensils",
  "plane",
  "landmark",
  "tent",
  "target",
  "bar-chart",
  "rocket",
  "clock",
  "shield-check",
  "briefcase",
] as const;

/** Brand gradients (resolved to CSS by the frontend `GRAD` map) */
export const PACKAGE_BAND_KEYS = [
  "gold",
  "rose",
  "violet",
  "navy",
  "amber",
  "plum",
] as const;

export type PackageIconName = (typeof PACKAGE_ICON_NAMES)[number] | (string & {});
export type PackageBandKey = (typeof PACKAGE_BAND_KEYS)[number] | (string & {});

/** One row of the day-by-day itinerary: day marker, title, description. */
export type ItineraryDay = { d: string; t: string; x: string };

/** A stat tile on the detail panel: icon, value, caption. */
export type PackageStat = { icon: PackageIconName; v: string; k: string };

export type PackageItem = {
  /** Stable id — used as the React key and the open/closed toggle target */
  id: string;
  title: string;
  /** Also populates the enquiry form's Region dropdown */
  region: string;
  duration: string;
  season: string;
  price: string;
  /** Struck-through "was" price; leave empty to hide it */
  old: string;
  icon: PackageIconName;
  band: PackageBandKey;
  summary: string;
  itinerary: ItineraryDay[];
  includes: string[];
  stats: PackageStat[];
  docsTitle: string;
  docs: string[];
};

/** One tab of the block, e.g. "International" / "Domestic". */
export type PackageTab = {
  id: string;
  label: string;
  packages: PackageItem[];
};

/**
 * The full block document stored in `package_blocks.content`.
 * Field-for-field compatible with the frontend `PackagesConfig`.
 */
export type PackageBlockContent = {
  /** Anchor id used for in-page links / the host page's table of contents */
  anchorId: string;
  /** Label shown in the host page's sticky table of contents */
  tocLabel: string;
  badge: string;
  badgeIcon: PackageIconName;
  heading: string;
  subtitle: string;
  /** Heading above the itinerary list on the detail panel */
  itineraryTitle: string;
  /** Heading above the "what's included" list */
  includesTitle: string;
  /** Small print under the price, e.g. "per person · twin sharing" */
  priceNote: string;
  /** Reassurance line under the enquiry button */
  callbackNote: string;
  /** Text of the button that opens the enquiry popup */
  enquireCta: string;
  enquiry: {
    kicker: string;
    regionLabel: string;
    ctaText: string;
    successHeading: string;
    /** "{region}" is replaced with the package's region */
    successText: string;
    successButton: string;
  };
  tabs: PackageTab[];
};

export function createItineraryDay(): ItineraryDay {
  return { d: "", t: "", x: "" };
}

export function createStat(): PackageStat {
  return { icon: "users", v: "", k: "" };
}

export function createPackageItem(): PackageItem {
  return {
    id: "",
    title: "",
    region: "",
    duration: "",
    season: "",
    price: "",
    old: "",
    icon: "palmtree",
    band: "gold",
    summary: "",
    itinerary: [],
    includes: [],
    stats: [],
    docsTitle: "",
    docs: [],
  };
}

export function createPackageTab(): PackageTab {
  return { id: "", label: "", packages: [] };
}

export function emptyPackageBlockContent(): PackageBlockContent {
  return {
    anchorId: "packages",
    tocLabel: "Packages",
    badge: "",
    badgeIcon: "plane",
    heading: "",
    subtitle: "",
    itineraryTitle: "Day-by-day itinerary",
    includesTitle: "What's included",
    priceNote: "per person · twin sharing · taxes extra",
    callbackNote: "Callback within 30 minutes",
    enquireCta: "Enquire about this package",
    enquiry: {
      kicker: "GET A CALLBACK",
      regionLabel: "Region",
      ctaText: "Request a Callback",
      successHeading: "Request received!",
      successText:
        "Our travel expert will call you back within 30 minutes about the {region} package.",
      successButton: "Done",
    },
    tabs: [],
  };
}

/**
 * Clean a list of target page slugs: slugify each, drop blanks, de-duplicate.
 * Shared by the admin form and the API so the stored value always matches what
 * the frontend looks up.
 */
export function normalizeTargetPages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const slug = packageSlugify(raw);
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

/** Slugify used for block slugs and per-package ids. */
export function packageSlugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
