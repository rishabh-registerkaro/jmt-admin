// Contact page copy — Figma "JMT" → "Contact page — Desktop 1440" (302:2) and
// "Contact page — Mobile 390" (304:2).
//
// Phone, WhatsApp, email, hours and reply time are NOT here: they come from
// the admin (Homepage → Contact details, `chrome.contact`), so they match the
// navbar, footer and homepage. The office address and company registration
// numbers below are still blank in the design ("to add"). An empty value
// renders the orange "to add" placeholder from the design.
//
// This is the bundled default: the copy is edited in jmt-admin (Dashboard →
// Contact) and merged over it (server/sitePages.ts).
// English only for now; /bn and /hi show this English copy.

import type { ContactService } from "@/utils/contactForm";

export interface AccentHeading {
  lead: string;
  accent: string;
  tail?: string;
}

export const CONTACT_PAGE = {
  meta: {
    title: "Contact JMT | Site labour supply for contractors",
    description:
      "Send your site details once. The JMT team replies within 2 working hours with next steps, and a written crew plan follows the site visit.",
  },

  hero: {
    crumbHome: "Home",
    crumb: "Contact",
    pill: { desktop: "Contact JMT · For contractors and project teams", mobile: "Contact JMT · For contractors" },
    title: { lead: "Tell us about your site.", accent: "We’ll plan the crew." } satisfies AccentHeading,
    subtitle: {
      desktop:
        "Send your site details once. Our team replies within 2 working hours with next steps, and a written crew plan follows the site visit.",
      mobile: "Send your site details once. Our team replies within 2 working hours.",
    },
  },

  card: {
    company: "Joy Maa Tara Bama Kripa Pvt. Ltd.",
    tagline: "Labour contractor for civil and infrastructure sites, West Bengal",
    labels: { phone: "Business line", whatsapp: "WhatsApp", email: "Email", reply: "Reply time" },
    whatsappValue: "Chat with our team",
    // Icon keys: "shield" | "users" | "file" (BusinessCard maps them to Lucide icons).
    proofs: [
      { icon: "shield", label: "PF and ESIC compliant" },
      { icon: "users", label: "Supervisor on every crew" },
      { icon: "file", label: "Records every month" },
    ],
    languages: { long: "English, Bengali, Hindi", short: "EN, বাং, हिं" },
  },

  form: {
    title: "Send an enquiry",
    requiredNote: "All fields marked * are required.",
    serviceLabel: "What do you need?",
    labels: {
      name: "Your name",
      companyName: "Company",
      phone: "Phone / WhatsApp",
      siteLocation: "Site location",
      headcount: "Crew size",
      startDate: "Start date",
      note: "Anything else? (optional)",
    },
    placeholders: {
      name: "Full name",
      companyName: "Company or contractor name",
      phone: "+91",
      siteLocation: "City or site name",
      headcount: { desktop: "e.g. 12 workers", mobile: "e.g. 12" },
      note: "Roles, shift pattern, site conditions…",
    },
    /** Display labels for the stored English values (same text in English). */
    services: {
      "Site labour supply": "Site labour supply",
      "Supervision and compliance": "Supervision and compliance",
      "Skilled trade crews": "Skilled trade crews",
    } satisfies Record<ContactService, string>,
    submit: "Send enquiry",
    submitting: "Sending…",
    whatsapp: { desktop: "Prefer WhatsApp? Send these details there", mobile: "Prefer WhatsApp? Send details there" },
    reassurance: {
      desktop: "Our team replies within 2 working hours. No spam, no sales calls.",
      mobile: "Reply within 2 working hours. No spam.",
    },
    honeypot: "Leave this field empty",
    successTitle: "Enquiry sent",
    sendAnother: "Send another enquiry",
    messages: {
      success: "Thanks — your enquiry is in. Our team will call you back within 2 working hours.",
      invalid: "Please check the highlighted fields.",
      error: "We couldn't send your enquiry just now. Please try again, or call or WhatsApp us directly.",
    },
  },

  options: {
    eyebrow: "Other ways to reach us",
    title: { lead: "Pick the channel that", accent: "suits the job", tail: "." } satisfies AccentHeading,
    intro: "Every channel reaches the same JMT team.",
    languages: "We speak English, Bengali and Hindi.",
    call: {
      title: "Call",
      text: { desktop: "Urgent crew needed this week", mobile: "Urgent crew this week" },
      reply: { desktop: "Answered in working hours", mobile: "Working hours" },
      link: "Call now",
    },
    email: {
      title: "Email",
      text: { desktop: "Tenders, purchase orders and compliance documents", mobile: "Tenders, POs, compliance documents" },
      reply: { desktop: "Reply within 1 working day", mobile: "Within 1 working day" },
      link: "Write to us",
    },
    visit: {
      title: "Visit",
      text: { desktop: "Meet our team at the office", mobile: "Meet our team" },
      reply: { desktop: "By appointment", mobile: "By appointment" },
      link: "Book a visit",
      /** Shown until `office.address` is set. */
      placeholder: "West Bengal · address to add",
    },
  },

  steps: {
    eyebrow: "After you enquire",
    title: "What happens next",
    items: [
      { when: "Within 2 hours", title: "We call you back", text: "To confirm roles, crew size and start date." },
      { when: "Within 48 hours", title: "Site visit and crew plan", text: "A written plan with rates for your approval." },
      { when: "From day 3", title: "Crew on site", text: "Checked, inducted and with a JMT supervisor." },
    ],
  },

  office: {
    eyebrow: "Office and company details",
    title: { lead: "Find us, and everything", accent: "procurement", tail: "needs." } satisfies AccentHeading,
    intro: "Vendor registration paperwork ready on request.",
    officeLabel: "Our office",
    region: "West Bengal, India",
    /** Full street address. null → "Office address to add". */
    address: null as string | null,
    addressPlaceholder: "Office address to add",
    pinTitle: "JMT office",
    pinPlaceholder: "Address to add",
    directions: "Get directions",
    whatsapp: "Prefer WhatsApp? Message us anytime",
    procurementTitle: "For procurement teams",
    toAdd: "To add",
    details: [
      { label: "Registered name", value: "Joy Maa Tara Bama Kripa Pvt. Ltd." as string | null },
      { label: "CIN", value: null as string | null },
      { label: "GSTIN", value: null as string | null },
      { label: "CLRA licence", value: null as string | null },
    ],
  },

  workers: {
    text: "Looking for work?",
    link: { desktop: "Go to Join our crew", mobile: "Join our crew" },
  },
};

export type ContactPageContent = typeof CONTACT_PAGE;

/** Google Maps search for the office (or the region until the address is set). */
export function officeMapsUrl(page: Pick<ContactPageContent, "office" | "card">): string {
  const { address, region } = page.office;
  const query = address ? `${page.card.company}, ${address}` : `${page.card.company}, ${region}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
