// SHARED FILE — an identical copy lives in jmt-admin/data/homepageFallback.ts and
// jmt-frontend/data/homepageFallback.ts. Change both together.
//
// Figma-accurate default content for the public homepage ("JMT -- Home").
//
// These constants seed `defaultHomeContent()` in
// app/lib/content/home-content.ts, which is what the admin's Homepage editor
// starts from and what the public page shows when no `home_pages` row exists
// or MySQL is unreachable. The bundled photos (FALLBACK_IMAGES) are also used
// whenever an image field in the CMS is left empty.
//
// Square-bracketed values ("[5]", "[info@domain]") are placeholders carried
// over from the design for the client to confirm — keep the brackets until a
// real value is agreed.

import type {
  ContactInfo,
  FaqGroup,
  FounderContent,
  HeroContent,
  HomeImage,
  LeadFormCopy,
  ProcessStep,
  ReasonItem,
  ServiceCard,
  SiteChrome,
  SiteTypeCard,
  TradeCard,
} from "@/types/homepage";

const ASSET_DIR = "/homepage";

function asset(
  file: string,
  alt: string,
  width: number,
  height: number,
  focus?: HomeImage["focus"],
): HomeImage {
  return { src: `${ASSET_DIR}/${file}`, alt, width, height, focus };
}

/** Bundled imagery, keyed by the media slot an admin can override (see queries). */
export const FALLBACK_IMAGES = {
  hero: asset(
    "hero-bg.webp",
    "Site crew in hard hats and hi-vis vests tying rebar on a metro construction deck at golden hour",
    1024,
    577,
  ),
  why: asset(
    "why-site.webp",
    "Excavators and workers on a large foundation pit with rebar laid for the base slab",
    1400,
    1050,
  ),
  founder: asset(
    "founder.webp",
    "Portrait of the founder, smiling with arms crossed in the office",
    1000,
    1498,
    "upper",
  ),
  banner: asset(
    "banner-team.webp",
    "A line of site workers and supervisors in hard hats and safety vests in front of a metro viaduct",
    2172,
    724,
    "right",
  ),
  contact: asset(
    "contact-crane.webp",
    "Tower crane and building frame silhouetted against a sunset sky",
    1200,
    686,
  ),
} satisfies Record<string, HomeImage>;

export type HomeMediaSlot = keyof typeof FALLBACK_IMAGES;

/** Service card photos, used in order for CMS services too (pages have no image field). */
export const SERVICE_IMAGES: HomeImage[] = [
  asset(
    "service-site-labour.webp",
    "Site supervisor in a turban briefing a team while holding a clipboard",
    1400,
    944,
  ),
  asset(
    "service-supervision.webp",
    "Two engineers in hard hats and hi-vis vests reviewing drawings on site",
    900,
    600,
  ),
  asset(
    "service-trade-crews.webp",
    "Three smiling workers in orange hard hats",
    900,
    900,
  ),
  asset(
    "service-industrial.webp",
    "Smiling worker in a white hard hat inside an industrial factory hall",
    1700,
    949,
  ),
];

// ── Contact & chrome ─────────────────────────────────────────────────────────

export const FALLBACK_CONTACT: ContactInfo = {
  phoneDisplay: "+91 XXXXX XXXXX",
  phoneHref: null,
  whatsappDisplay: "WhatsApp",
  whatsappHref: null,
  emailDisplay: "[info@domain]",
  emailHref: null,
  hours: "Mon to Sat, 8 am to 8 pm",
  replyTime: "Within 24 hours",
};

const SERVICE_LINKS = [
  { label: "Site labour supply", href: "#services" },
  { label: "Supervision and compliance", href: "#services" },
  { label: "Skilled trade crews", href: "#trades" },
  { label: "Industrial manpower", href: "#services" },
];

/** Bundled logos, used whenever the admin leaves a logo field empty. */
export const BRAND_LOGOS = {
  header: asset("logo-header.svg", "Joy Maa Tara Bama Kripa", 150, 52),
  footer: asset("logo-footer.svg", "Joy Maa Tara Bama Kripa", 269, 96),
} satisfies Record<string, HomeImage>;

export const FALLBACK_CHROME: SiteChrome = {
  brand: {
    name: "Joy Maa Tara Bama Kripa",
    headerLogo: BRAND_LOGOS.header,
    footerLogo: BRAND_LOGOS.footer,
  },
  labels: {
    callButton: "Call",
    whatsappButton: "WhatsApp",
    footerContactTitle: "Contact",
  },
  languages: [
    { code: "en", label: "EN", name: "English" },
    { code: "bn", label: "বাং", name: "বাংলা (Bengali)" },
    { code: "hi", label: "हिं", name: "हिन्दी (Hindi)" },
  ],
  nav: [
    { label: "Services", href: "#services", children: SERVICE_LINKS },
    { label: "How we work", href: "#how-we-work", children: [] },
    { label: "About", href: "#about", children: [] },
    { label: "Join our crew", href: "#join-our-crew", children: [] },
    { label: "Contact", href: "#contact", children: [] },
  ],
  footerColumns: [
    {
      title: "Services",
      links: [
        { label: "Site labour supply", href: "#services" },
        { label: "Supervision and compliance", href: "#services" },
        { label: "Sites we staff", href: "#sites" },
        { label: "Trades we supply", href: "#trades" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "How we work", href: "#how-we-work" },
        { label: "About", href: "#about" },
        { label: "Join our crew", href: "#join-our-crew" },
        { label: "Contact", href: "#contact" },
      ],
    },
  ],
  footerDescription:
    "Reliable, fully compliant site crews for bridges, metro and civil works. Run by the founder, on site.",
  copyright: null,
  contact: FALLBACK_CONTACT,
};

// ── Sections ─────────────────────────────────────────────────────────────────

export const FALLBACK_HERO: HeroContent = {
  eyebrow: "Labour contractor, West Bengal",
  titleLead: "Site crews for",
  titleAccent: "Bridges, Metro",
  titleTail: "and Civil works.",
  subtitle:
    "Skilled and unskilled workers, fully registered, deployed fast and managed on site by our own supervisors.",
  primaryCta: "Request workers",
  primaryHref: "#contact",
  secondaryCta: "Join our crew",
  secondaryHref: "#join-our-crew",
  whatsappCta: "Prefer WhatsApp?",
  trustPoints: [
    { icon: "verified", label: "Verified Workforce" },
    { icon: "fast", label: "Fast Development" },
    { icon: "support", label: "On-Site Support" },
  ],
  image: FALLBACK_IMAGES.hero,
};

export const FALLBACK_SERVICES: ServiceCard[] = [
  {
    id: "site-labour-supply",
    title: "Site labour supply",
    eyebrow: "Skilled, semi-skilled and unskilled",
    badge: null,
    href: "#contact",
    image: SERVICE_IMAGES[0],
  },
  {
    id: "supervision-and-compliance",
    title: "Supervision and compliance",
    eyebrow: null,
    badge: null,
    href: "#how-we-work",
    image: SERVICE_IMAGES[1],
  },
  {
    id: "skilled-trade-crews",
    title: "Skilled trade crews",
    eyebrow: null,
    badge: null,
    href: "#trades",
    image: SERVICE_IMAGES[2],
  },
  {
    id: "industrial-manpower",
    title: "Industrial manpower",
    eyebrow: null,
    badge: "Coming soon",
    href: "#contact",
    image: SERVICE_IMAGES[3],
  },
];

/** Site-type cards; each links to the contact form by default. */
export const SITE_TYPES: Omit<SiteTypeCard, "href">[] = [
  {
    id: "bridges",
    title: "Bridges and flyovers",
    description: "Piers, pile caps, decks, girders",
    image: asset(
      "site-bridges.webp",
      "Steel truss bridge over a river lit up at dusk",
      1280,
      720,
    ),
  },
  {
    id: "metro",
    title: "Metro viaducts",
    description: "Segments, piers, night shifts",
    image: asset(
      "site-metro.webp",
      "Elevated metro viaduct on concrete piers against a blue sky",
      1300,
      975,
    ),
  },
  {
    id: "stations",
    title: "Stations and depots",
    description: "Civil, finishing and MEP support",
    image: asset(
      "site-stations.webp",
      "Fuel station forecourt canopy under a bright sky",
      1300,
      866,
    ),
  },
  {
    id: "buildings",
    title: "Buildings",
    description: "Structure, masonry, finishing",
    image: asset(
      "site-buildings.webp",
      "High-rise city skyline at twilight",
      1300,
      866,
      "left",
    ),
  },
];

export const REASONS: ReasonItem[] = [
  {
    number: "01",
    title: "Owner on every call",
    description:
      "You deal with the founder directly, not a call centre. Decisions are made the same day.",
    tag: "Direct",
  },
  {
    number: "02",
    title: "Compliance you can show",
    description:
      "PF, ESIC, wage proof and licence copies shared every month, ready for your auditor.",
    tag: "On paper",
  },
  {
    number: "03",
    title: "Construction crews only",
    description:
      "Bridges, metro, buildings and roads. That's all we staff, so our supervisors know your site.",
    tag: "Focused",
  },
];

export const TRADES: TradeCard[] = [
  {
    id: "masonry",
    title: "Masonry crews",
    icon: "masonry",
    image: asset(
      "trade-masonry.webp",
      "Smiling mason in a knitted cap and work gloves beside a brick wall",
      1200,
      800,
    ),
  },
  {
    id: "shuttering",
    title: "Shuttering and rebar crews",
    icon: "shuttering",
    image: asset(
      "trade-shuttering.webp",
      "Worker in a yellow hard hat tying a tall rebar cage",
      1200,
      800,
    ),
  },
  {
    id: "welding",
    title: "Welding and rigging crews",
    icon: "welding",
    image: asset(
      "trade-welding.webp",
      "Welder in a protective mask with sparks flying from a steel joint",
      1200,
      800,
    ),
  },
  {
    id: "helpers",
    title: "Helpers and material",
    icon: "helpers",
    image: asset(
      "trade-helpers.webp",
      "Group of smiling site helpers in hard hats with arms crossed",
      1400,
      785,
      "right",
    ),
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: "01",
    icon: "requirement",
    title: "Share your requirement",
    description: "Reach us by call, WhatsApp or the form, and tell us what the site needs.",
    outcomeLabel: "You send",
    outcome: "Trades, headcount, site location, start date and shift pattern",
  },
  {
    number: "02",
    icon: "site-visit",
    title: "Site visit and crew plan",
    description: "We inspect the site and note its safety needs before planning the crew.",
    outcomeLabel: "You approve",
    outcome: "A written crew plan with rates",
  },
  {
    number: "03",
    icon: "crew",
    title: "Crew on site",
    description:
      "Workers arrive inducted and in PPE, and attendance is recorded from day one.",
    outcomeLabel: "On site",
    outcome: "An ID-checked crew with a JMT supervisor",
  },
  {
    number: "04",
    icon: "records",
    title: "Monthly records and support",
    description:
      "You get your records every month, and workers who don’t suit the site are replaced.",
    outcomeLabel: "Every month",
    outcome: "Wage register, attendance and PF/ESIC challans",
  },
];

export const FOUNDER: FounderContent = {
  name: "Akash Gupta",
  initials: "AG",
  role: "Founder and Director",
  heading: "You talk to the owner, not a call centre.",
  story:
    "I started Joy Maa Tara Bama Kripa to run labour supply the way contractors need it: one person accountable, crews that turn up as planned, and paperwork ready before anyone asks for it. Every enquiry comes to me directly. I visit your site, agree the crew plan with you, and stay your single point of contact for as long as we work together.",
  image: FALLBACK_IMAGES.founder,
  assurances: [
    "Site induction",
    "PPE logged",
    "ID verified",
    "Minimum wages",
    "PF and ESIC monthly",
    "Attendance kept",
  ],
  ctaLabel: "Contact",
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    audience: "companies",
    label: "For companies",
    items: [
      {
        id: "minimum-crew",
        question: "What's the minimum crew size?",
        answer:
          "Usually a crew of [5] or more. For smaller needs, call us and we will tell you straight.",
      },
      {
        id: "areas",
        question: "Which areas do you serve?",
        answer:
          "We are based in West Bengal and staff sites across [West Bengal and neighbouring states]. Share your site location and we will confirm before you commit.",
      },
      {
        id: "deploy-speed",
        question: "How fast can you deploy?",
        answer:
          "Once you approve the crew plan, standard trades are usually on site within [7 days]. Larger or specialised crews take longer, and we give you the date up front.",
      },
      {
        id: "rates",
        question: "How are rates worked out?",
        answer:
          "Rates depend on the trade, skill level, headcount, shift pattern and site location. After the site visit you get a written crew plan with rates before anyone is deployed.",
      },
      {
        id: "supervision",
        question: "Who supervises the crew?",
        answer:
          "Every crew comes with our own JMT supervisor on site, who handles attendance, discipline and day-to-day coordination with your site engineer.",
      },
      {
        id: "documents",
        question: "What documents do we get?",
        answer:
          "Every month you receive the wage register, attendance records and PF/ESIC challans, plus licence copies, ready for your auditor.",
      },
    ],
  },
  {
    audience: "workers",
    label: "For workers",
    items: [
      {
        id: "join",
        question: "How do I join a crew?",
        answer:
          "Call or WhatsApp us with your trade and experience. We check your ID, complete a site induction and place you with the next suitable crew.",
      },
      {
        id: "pf-esic",
        question: "Will I get PF and ESIC?",
        answer:
          "Yes. Registered workers are paid at least minimum wages, and PF and ESIC are deposited every month.",
      },
      {
        id: "ppe",
        question: "Do I need my own safety gear?",
        answer:
          "No. You are issued PPE before going on site, and it is logged during your induction.",
      },
    ],
  },
];

// ── Contact card & lead form copy ────────────────────────────────────────────

export const CONTACT_LABELS = {
  call: "Call",
  whatsapp: "WhatsApp",
  whatsappValue: "Chat with us",
  reply: "Reply time",
};

export const LEAD_FORM_COPY: LeadFormCopy = {
  labels: {
    companyName: "Company name",
    name: "Your name",
    phone: "Phone / WhatsApp",
    siteLocation: "Site location",
    headcount: "Headcount",
    startDate: "Start date",
  },
  optionalHint: "(optional)",
  submit: "Request workers",
  submitting: "Sending…",
  successTitle: "Request received",
  successText: "Thanks — your requirement is in. The owner will call you back within 24 hours.",
  resetLabel: "Send another request",
  invalidText: "Please check the highlighted fields.",
  errorText: "We couldn't send your request just now. Please try again, or call or WhatsApp us directly.",
};
