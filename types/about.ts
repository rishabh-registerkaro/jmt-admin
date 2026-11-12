// About page content (Figma "JMT" → "About page — Desktop 1440" 289:2 and
// "About page — Mobile 390" 296:2). The bundled copy lives in data/about.ts.

import type { HomeImage } from "@/types/homepage";

/**
 * Copy that the mobile frame shortens. `short` is shown below md (768px),
 * `text` from md up; without `short`, `text` is shown everywhere.
 */
export interface Copy {
  text: string;
  short?: string;
}

/** Heading with an orange accent phrase: "{lead} {accent}{tail}". */
export interface AccentHeading {
  lead: string;
  accent: string;
  /** Appended right after the accent, so it starts with its own space or punctuation. */
  tail: string;
}

/** Eyebrow, heading and the short aside on the right (desktop) / below (mobile). */
export interface AboutSectionCopy {
  eyebrow: string;
  heading: AccentHeading;
  /** Desktop aside. Absent in the mobile frame where `introShort` is null. */
  intro: string | null;
  /** Mobile intro: undefined = same as `intro`, null = not shown on phones. */
  introShort?: string | null;
}

export type AboutServiceIcon = "users" | "shield" | "hat" | "factory";
export type AboutSiteIcon = "bridge" | "train" | "station" | "building" | "road";
export type AboutValueIcon = "phone" | "file" | "hat";
export type AboutDetailIcon = "hammer" | "flag" | "cal" | "file";

export interface AboutService {
  icon: AboutServiceIcon;
  title: string;
  /** Desktop only. */
  text: string;
  live: boolean;
}

export interface AboutHeroContent {
  pill: Copy;
  heading: AccentHeading;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  mission: {
    pill: string;
    title: string;
    text: Copy;
    servicesTitle: string;
    liveBadge: Copy;
    liveLabel: string;
    soonLabel: string;
    services: AboutService[];
  };
}

export interface AboutSiteStrip {
  caption: string;
  sites: { icon: AboutSiteIcon; label: Copy }[];
}

export interface AboutRole {
  label: string;
  /** Brown dot instead of orange (Figma: the JMT site supervisor). */
  lead?: boolean;
}

export interface AboutTradesContent {
  heading: AccentHeading;
  intro: Copy;
  /** Desktop marquee: three rows. */
  rows: AboutRole[][];
  /** Phones: one wrapped list. */
  roles: AboutRole[];
  cta: string;
}

export interface AboutValue {
  icon: AboutValueIcon;
  title: string;
  text: string;
  proof: string;
}

export interface AboutValuesContent {
  pill: string;
  heading: AccentHeading;
  values: AboutValue[];
}

export interface AboutPerson {
  image: HomeImage;
  tag?: string;
  name: string;
  text: Copy;
}

export interface AboutTeamContent {
  copy: AboutSectionCopy;
  founder: AboutPerson;
  people: AboutPerson[];
  join: { title: string; text: Copy; cta: string };
  quote: { text: string; name: string; role: string };
}

export interface AboutStandardsContent {
  copy: AboutSectionCopy;
  headlines: { title: string; text: string }[];
  details: { icon: AboutDetailIcon; title: string; text: string }[];
}

export interface AboutPromisesContent {
  pill: string;
  title: string;
  text: Copy;
  assurances: string[];
  promises: { value: string; unit: string; label: Copy }[];
}

export interface AboutRecoveryContent {
  copy: AboutSectionCopy;
  steps: { title: string; text: string }[];
  facts: { value: string; label: string }[];
}

export interface AboutWhereContent {
  copy: AboutSectionCopy;
  base: { eyebrow: string; title: string; address: string; hours: string };
  siteEyebrow: string;
  sites: { image: HomeImage; title: string; text: string }[];
}

export interface AboutOpening {
  tag: string;
  title: string;
  text: string;
}

export interface AboutJoinContent {
  copy: AboutSectionCopy;
  perks: string[];
  applyCta: string;
  openings: AboutOpening[];
}

export interface AboutCtaContent {
  title: string;
  text: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface AboutPageContent {
  meta: { title: string; description: string };
  hero: AboutHeroContent;
  sites: AboutSiteStrip;
  trades: AboutTradesContent;
  values: AboutValuesContent;
  team: AboutTeamContent;
  standards: AboutStandardsContent;
  promises: AboutPromisesContent;
  recovery: AboutRecoveryContent;
  where: AboutWhereContent;
  join: AboutJoinContent;
  cta: AboutCtaContent;
}
