// Join our crew page copy — Figma "JMT" → "Join our crew — Desktop 1440"
// (311:2) and "Join our crew — Mobile 390" (313:2). Where the mobile frame
// shortens a line, it is the `short` of a Copy (types/about.ts).
//
// Phone, WhatsApp and hours are NOT here: they come from the admin (Homepage →
// Contact details, `chrome.contact`), so they match the navbar and footer.
// This is the bundled default: the copy is edited in jmt-admin (Dashboard →
// Join Our Crew) and merged over it (server/sitePages.ts).
// English only for now; /bn and /hi show this English copy.

import type { HomeImage } from "@/types/homepage";
import type { AccentHeading, Copy } from "@/types/about";
import type { JOIN_EXPERIENCE, JOIN_LANGUAGES, JOIN_START, JOIN_TRADES } from "@/utils/joinForm";

const photo = (src: string, alt: string, width: number, height: number, focus?: HomeImage["focus"]): HomeImage => ({
  src,
  alt,
  width,
  height,
  ...(focus ? { focus } : {}),
});

const CREW = photo("/about/person-crews.webp", "A JMT crew in hard hats on site", 1499, 840);
const MASONRY = photo("/join/work-masonry.webp", "A smiling mason at a brick wall", 1560, 1040);
const SHUTTERING = photo("/join/work-shuttering.webp", "A worker tying rebar for a column", 1560, 1040);
const WELDING = photo("/join/work-welding.webp", "A welder at work, sparks flying", 1560, 1040);

export type BenefitIcon = "wallet" | "shield" | "hat" | "book" | "user" | "home";
export type StepIcon = "file" | "phone" | "hammer" | "hat";
export type SiteIcon = "bridge" | "train" | "station" | "building" | "road";
export type ReadyIcon = "id" | "bank" | "phone";

type Trade = (typeof JOIN_TRADES)[number];
type Experience = (typeof JOIN_EXPERIENCE)[number];
type Language = (typeof JOIN_LANGUAGES)[number];
type Start = (typeof JOIN_START)[number];

export interface JoinSectionCopy {
  eyebrow: string;
  heading: AccentHeading;
  /** Desktop aside. */
  intro: string | null;
  /** Phones: undefined = same as `intro`, null = not shown. */
  introShort?: string | null;
}

export const JOIN_PAGE = {
  meta: {
    title: "Join our crew | Construction jobs in West Bengal — JMT",
    description:
      "Masons, bar benders, welders, helpers and supervisors for bridge, metro and building sites in West Bengal. Wages on time, PF and ESIC, free safety gear. No joining fee.",
  },

  hero: {
    crumbHome: "Home",
    crumb: "Join our crew",
    pill: "JOIN OUR CREW · NOW HIRING",
    heading: { lead: "Work on big sites.", accent: "Get paid right", tail: ", every month." } satisfies AccentHeading,
    subtitle: {
      text: "Masons, bar benders, welders, helpers and supervisors for bridge, metro and building sites in West Bengal. No joining fee.",
      short: "Masons, bar benders, welders, helpers and supervisors for sites in West Bengal. No joining fee.",
    } satisfies Copy,
    primaryCta: "Apply now",
    whatsappCta: "Apply on WhatsApp",
    alsoIn: "Also in",
    /** Collage: one tall photo and two stacked ones (desktop); phones show the first. */
    photos: { main: CREW, top: SHUTTERING, bottom: MASONRY },
    card: { title: "EVERY JMT WORKER GETS", items: ["Wages on time", "PF and ESIC", "Free safety gear"] },
  },

  benefits: {
    copy: {
      eyebrow: "WHY WORK WITH JMT",
      heading: { lead: "What you get when you", accent: "join our crew", tail: "." },
      intro: "Simple promises, the same for every worker on every site.",
      introShort: null,
    } satisfies JoinSectionCopy,
    items: [
      { icon: "wallet", title: "Wages on time", text: "At or above minimum wage, paid every month." },
      { icon: "shield", title: "PF and ESIC", text: "Filed every month. Your family is covered too." },
      { icon: "hat", title: "Free safety gear", text: "Helmet, shoes, vest and gloves before day one." },
      { icon: "book", title: "Training in your language", text: "Safety and work explained in Bengali or Hindi." },
      { icon: "user", title: "A supervisor who helps", text: "One JMT supervisor on your site, every shift." },
      { icon: "home", title: "Stay and food explained", text: "We tell you about stay, travel and food before you join a site." },
    ] satisfies { icon: BenefitIcon; title: string; text: string }[],
    noFee: {
      badge: "₹0",
      title: "No joining fee. Ever.",
      text: {
        text: "JMT never asks workers for money to get a job. If anyone asks you to pay in our name, call us.",
        short: "If anyone asks you to pay in our name, call us.",
      } satisfies Copy,
    },
  },

  work: {
    copy: {
      eyebrow: "WHAT WE DO",
      heading: { lead: "The", accent: "work we do", tail: "." },
      intro: "Our crews build bridges, metro lines and buildings across West Bengal.",
    } satisfies JoinSectionCopy,
    cards: [
      { image: MASONRY, title: { text: "Masonry" }, text: { text: "Brickwork, blockwork, plaster", short: "Brickwork, plaster" } },
      {
        image: SHUTTERING,
        title: { text: "Shuttering and rebar" },
        text: { text: "Formwork, bar bending and tying", short: "Formwork, bar bending" },
      },
      {
        image: WELDING,
        title: { text: "Welding and site services", short: "Welding and services" },
        text: { text: "Welding, electrical, plumbing, rigging", short: "Welding, electrical, plumbing" },
      },
      {
        image: CREW,
        title: { text: "Helpers and material" },
        text: { text: "Loading, cleaning, assisting every trade", short: "Loading, cleaning, assisting" },
      },
    ] satisfies { image: HomeImage; title: Copy; text: Copy }[],
    where: {
      label: "Where you’ll work:",
      sites: [
        { icon: "bridge", label: { text: "Bridges and flyovers", short: "Bridges" } },
        { icon: "train", label: { text: "Metro viaducts", short: "Metro" } },
        { icon: "station", label: { text: "Stations and depots", short: "Stations" } },
        { icon: "building", label: { text: "Buildings" } },
        { icon: "road", label: { text: "Roads" } },
      ] satisfies { icon: SiteIcon; label: Copy }[],
    },
  },

  hiring: {
    copy: {
      eyebrow: "HOW HIRING WORKS",
      heading: { lead: "Four simple steps to your", accent: "first day", tail: "." },
      intro: "From your application to your first day on site.",
      introShort: null,
    } satisfies JoinSectionCopy,
    stepLabel: "STEP",
    steps: [
      { icon: "file", title: "Apply", text: "Fill the form below, or send us a WhatsApp." },
      { icon: "phone", title: "We call you", text: "Within 2 working days, in your language." },
      { icon: "hammer", title: "Show your skill", text: "A short practical check. A mason lays a few courses." },
      { icon: "hat", title: "Start work", text: "ID check, site training and safety gear, then you join your crew." },
    ] satisfies { icon: StepIcon; title: string; text: string }[],
    keepReady: {
      label: "KEEP READY",
      items: [
        { icon: "id", text: "ID proof (Aadhaar or voter card)" },
        { icon: "bank", text: "A bank account for wages" },
        { icon: "phone", text: "A working phone number" },
      ] satisfies { icon: ReadyIcon; text: string }[],
    },
  },

  apply: {
    eyebrow: "APPLY NOW",
    heading: { lead: "Apply in", accent: "2 minutes.", tail: "" } satisfies AccentHeading,
    intro: "Prefer to talk? Call or WhatsApp us, and we’ll fill it in for you.",
    callLabel: "CALL US",
    whatsappLabel: "WHATSAPP",
    whatsappText: "Chat with us",
    noFee: "No joining fee. Never pay anyone for a JMT job.",
    // Phones: two buttons and one line under the form.
    callButton: "Call us",
    whatsappButton: "WhatsApp",
    talkNote: "Prefer to talk? Call or WhatsApp us, and we’ll fill it in for you.",
  },

  form: {
    title: "Your application",
    required: "All fields marked * are required.",
    labels: {
      name: "Full name",
      phone: "Mobile / WhatsApp number",
      trade: "Your trade",
      experience: "Experience",
      location: "District or town",
      languages: "Language you speak",
      start: "When can you start?",
      consent: "JMT can call or WhatsApp me about work.",
    },
    placeholders: { name: "Your name", phone: "+91", location: "e.g. Howrah" },
    trades: [
      "Mason",
      "Bar bender",
      "Shuttering carpenter",
      "Welder",
      "Electrician",
      "Plumber",
      "Scaffolder",
      "Rigger",
      "General helper",
      "Site supervisor",
      "Other",
    ] satisfies Trade[],
    experience: ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"] satisfies Experience[],
    /** Stored in English; shown in their own script, as in the design. */
    languages: [
      { value: "Bengali", label: "বাংলা" },
      { value: "Hindi", label: "हिंदी" },
      { value: "English", label: "English" },
    ] satisfies { value: Language; label: string }[],
    start: ["Now", "In 1 week", "In 1 month"] satisfies Start[],
    submit: "Send application",
    sending: "Sending…",
    note: "No fee. We’ll call you within 2 working days.",
    messages: {
      /** Shown in place of the form once it is sent (Figma 312:293). */
      successTitle: "Application sent",
      success: "Thank you. Our team will call you within 2 working days. Keep your phone on.",
      whatsapp: "Send your ID on WhatsApp to save time",
      invalid: "Please check the highlighted fields.",
      error: "We couldn't send your application just now. Please try again, or call or WhatsApp us directly.",
    },
  },
};

export type JoinPageContent = typeof JOIN_PAGE;
