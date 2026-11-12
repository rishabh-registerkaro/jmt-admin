// Registry of the Joy Maa Tara site pages edited at /dashboard/site-pages/<key>
// and stored in the `jmt_site_pages` table (one JSON document per page).
//
// The bundled copy (data/about.ts, data/contactPage.ts, data/joinPage.ts —
// copies of jmt-frontend/data) is each page's schema and fallback: the editor
// renders one field per value, and saved content is merged over it
// (lib/sitePages/mergeContent.ts) here and again on the frontend.
//
// To make another page CMS-driven: add it here AND in
// jmt-frontend/lib/sitePages/registry.ts (same key and locked paths), then
// read it on the frontend through server/sitePages.ts.

import { ABOUT_PAGE } from "@/data/about";
import { CONTACT_PAGE } from "@/data/contactPage";
import { JOIN_PAGE } from "@/data/joinPage";
import { prepareDefaults, type PlainObject } from "@/lib/sitePages/mergeContent";

export interface SitePageSection {
  title: string;
  hint?: string;
}

export interface SitePageDefinition {
  /** Dashboard name. */
  title: string;
  /** Short description for the dashboard. */
  description: string;
  /** Public path on jmt-frontend (English; /bn and /hi show the same copy). */
  path: string;
  /** Bundled content, with optional fields made explicit. */
  defaults: PlainObject;
  /** One card per top-level key, in this order. Keys not listed come last. */
  sections: Record<string, SitePageSection>;
  /** Dropdown choices, keyed by path pattern ("[]" for list items). */
  options?: Record<string, readonly string[]>;
  /** Paths that always keep the bundled value (not shown in the editor). Must match the frontend. */
  locked?: readonly string[];
  /** Field hints, keyed by path pattern. */
  hints?: Record<string, string>;
}

const SITE_ICONS = ["bridge", "train", "station", "building", "road"] as const;

const SEO: SitePageSection = { title: "SEO", hint: "Browser tab title and search result description" };

export const SITE_PAGES = {
  about: {
    title: "About us",
    description: "Founder, team, values, standards and promises",
    path: "/about",
    defaults: prepareDefaults(ABOUT_PAGE) as unknown as PlainObject,
    sections: {
      meta: SEO,
      hero: { title: "Hero", hint: "Headline, buttons and the mission card with live services" },
      sites: { title: "Sites strip", hint: "Row of site types under the hero" },
      trades: { title: "Trades", hint: "Scrolling role chips (desktop rows and phone list)" },
      values: { title: "Values", hint: "Three value cards" },
      team: { title: "Team", hint: "Founder, team photos, join card and quote" },
      standards: { title: "Standards", hint: "Checks every worker gets" },
      promises: { title: "Promises", hint: "Assurances and promise numbers" },
      recovery: { title: "When something goes wrong", hint: "Steps and facts" },
      where: { title: "Where we work", hint: "Office base and site photos" },
      join: { title: "Join our crew", hint: "Perks and openings" },
      cta: { title: "Closing call to action" },
    },
    options: {
      "hero.mission.services[].icon": ["users", "shield", "hat", "factory"],
      "sites.sites[].icon": SITE_ICONS,
      "values.values[].icon": ["phone", "file", "hat"],
      "standards.details[].icon": ["hammer", "flag", "cal", "file"],
    },
    hints: {
      "trades.rows": "Desktop only: three rows that scroll sideways. Repeat roles to fill each row.",
      "trades.roles": "Phones only: one wrapped list of roles.",
      "where.base.address": "Shown as written. Leave the placeholder text until the office address is final.",
    },
  },

  contact: {
    title: "Contact",
    description: "Hero, enquiry form, contact options, next steps and office details",
    path: "/contact",
    defaults: prepareDefaults(CONTACT_PAGE) as unknown as PlainObject,
    sections: {
      meta: SEO,
      hero: { title: "Hero", hint: "Breadcrumb, headline and subtitle" },
      card: { title: "Business card", hint: "Company name, labels and proof chips. Phone, email and hours come from Homepage → Contact details." },
      form: { title: "Enquiry form", hint: "Labels, placeholders, buttons and messages" },
      options: { title: "Other ways to reach us", hint: "Call, email and visit cards" },
      steps: { title: "What happens next", hint: "Three steps after an enquiry" },
      office: { title: "Office and company details", hint: "Address and registration numbers" },
      workers: { title: "Workers line", hint: "Strip above the footer for job seekers" },
    },
    options: {
      "card.proofs[].icon": ["/contact/chip-shield.svg", "/contact/chip-users.svg", "/contact/chip-file.svg"],
    },
    hints: {
      "office.address": "Full street address. Leave empty to show the orange “to add” placeholder.",
      "office.details[].value": "Leave empty to show “To add”.",
      "form.services": "Labels for the “What do you need?” choices. The choices themselves are fixed.",
    },
  },

  "join-our-crew": {
    title: "Join our crew",
    description: "Hiring page for workers: benefits, work, steps and the application form",
    path: "/join-our-crew",
    defaults: prepareDefaults(JOIN_PAGE) as unknown as PlainObject,
    sections: {
      meta: SEO,
      hero: { title: "Hero", hint: "Headline, buttons, photo collage and benefits card" },
      benefits: { title: "Benefits", hint: "Why work with JMT, and the no-fee notice" },
      work: { title: "The work we do", hint: "Work cards and site types" },
      hiring: { title: "How hiring works", hint: "Steps and documents to keep ready" },
      apply: { title: "Apply section", hint: "Heading and call / WhatsApp panel" },
      form: { title: "Application form", hint: "Labels, placeholders, buttons and messages" },
    },
    options: {
      "benefits.items[].icon": ["wallet", "shield", "hat", "book", "user", "home"],
      "work.where.sites[].icon": SITE_ICONS,
      "hiring.steps[].icon": ["file", "phone", "hammer", "hat"],
      "hiring.keepReady.items[].icon": ["id", "bank", "phone"],
    },
    locked: ["form.trades", "form.experience", "form.start", "form.languages[].value"],
    hints: {
      "form.languages": "How each language is written on the form. The choices themselves are fixed.",
    },
  },
} satisfies Record<string, SitePageDefinition>;

export type SitePageKey = keyof typeof SITE_PAGES;

export const SITE_PAGE_KEYS = Object.keys(SITE_PAGES) as SitePageKey[];

export function isSitePageKey(value: unknown): value is SitePageKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SITE_PAGES, value);
}

export function getSitePageDefinition(key: SitePageKey): SitePageDefinition {
  return SITE_PAGES[key];
}
