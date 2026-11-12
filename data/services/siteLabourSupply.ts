// Content for the "Site labour supply" service page — Figma "JMT" → "Service
// page" (node 237:2). English only for now; /bn and /hi show this copy too
// until translations are added.

import type { HomeImage } from "@/types/homepage";
import type { ServicePageContent } from "@/types/service";

const img = (file: string, alt: string, width: number, height: number, focus?: HomeImage["focus"]): HomeImage => ({
  src: `/service/${file}`,
  alt,
  width,
  height,
  ...(focus ? { focus } : {}),
});

const IMAGES = {
  hero: img("hero.webp", "A JMT crew in hi-vis vests and helmets standing under an elevated metro viaduct", 2172, 724),
  newStructure: img("use-new-structure.webp", "Excavators and workers preparing foundations on a large site", 1200, 900),
  scalingUp: img("use-scaling-up.webp", "Underside of an elevated concrete viaduct", 900, 675),
  replacing: img("use-replacing.webp", "Two site engineers in helmets reviewing drawings", 900, 600),
  worker: img("included-worker.webp", "A smiling mason in a knit cap beside a brick wall", 1100, 733),
  shuttering: img("role-shuttering.webp", "A worker tying rebar cages for a column", 900, 600),
  welding: img("role-welding.webp", "A welder at work with sparks flying", 900, 600),
  helpers: img("role-helpers.webp", "A group of smiling workers in hard hats", 900, 504),
  monthly: img("plan-monthly.webp", "A crew laying rebar on a high-rise slab at sunset", 900, 507),
  project: img("plan-project.webp", "A steel cantilever bridge lit up at dusk", 900, 506),
  requirement: img("step-requirement.webp", "A site manager briefing a team with a clipboard", 900, 607),
  founder: img("faq-founder.webp", "Akash, founder of JMT, smiling with arms crossed in the office", 1000, 1498, "upper"),
  supervision: img("related-supervision.webp", "A JMT supervisor in uniform on site", 1300, 1300),
  tradeCrews: img("related-trade-crews.webp", "A skilled worker in a hard hat standing in a fabrication shop", 1300, 726),
};

export const SITE_LABOUR_SUPPLY: ServicePageContent = {
  slug: "site-service-supply",
  visible: {
    useCases: true,
    included: true,
    roles: true,
    crew: true,
    plans: true,
    steps: true,
    faq: true,
    related: true,
  },
  meta: {
    title: "Site labour supply | Joy Maa Tara",
    description:
      "Skilled, semi-skilled and unskilled workers for civil and infrastructure sites, matched to your work, supervised on site and scaled as your project moves.",
  },

  hero: {
    breadcrumb: { home: "Home", services: "Services", current: "Site labour supply" },
    tag: "Service · Site labour supply",
    title: { lead: "Site", accent: "labour supply,", tail: "ready when your site is." },
    subtitle:
      "Skilled, semi-skilled and unskilled workers for civil and infrastructure sites, matched to your work, supervised on site and scaled as your project moves.",
    primaryCta: "Request this crew",
    whatsappCta: "WhatsApp",
    image: IMAGES.hero,
    facts: [
      { icon: "users", label: "Crew size", value: "From 5 workers" },
      { icon: "clock", label: "Notice", value: "3 days" },
      { icon: "moon", label: "Shifts", value: "Day and night" },
      { icon: "refresh", label: "Replacement", value: "Within 48 hours" },
    ],
  },

  subnav: {
    links: [
      { id: "overview", label: "Overview" },
      { id: "roles", label: "Roles" },
      { id: "your-crew", label: "Your crew" },
      { id: "plans", label: "Plans" },
      { id: "how-it-works", label: "How it works" },
      { id: "faq", label: "FAQ" },
    ],
    cta: "Request this crew",
  },

  useCases: {
    copy: {
      eyebrow: "Is this for you",
      heading: { lead: "When you’d", accent: "use this" },
      intro: "Three situations where contractors bring in a JMT crew.",
    },
    cards: [
      {
        title: "Starting a new structure",
        text: "Mobilise a full crew for foundations, a new pour or a building block, with the right mix of trades planned before day one.",
        image: IMAGES.newStructure,
      },
      {
        title: "Scaling up for a deadline",
        text: "Add hands for a pour, a cycle or a handover, and release them when the push is over.",
        image: IMAGES.scalingUp,
      },
      {
        title: "Replacing a contractor",
        text: "Switch to a crew that turns up as planned, led by a supervisor who answers to your site engineer.",
        image: IMAGES.replacing,
      },
    ],
  },

  included: {
    copy: {
      eyebrow: "What’s included",
      heading: { lead: "What we provide, and", accent: "your part" },
      intro: "Agreed in writing before the crew moves.",
    },
    image: IMAGES.worker,
    chips: [
      { icon: "check", label: "PPE for every worker" },
      { icon: "shield", label: "Skill-checked" },
      { icon: "check", label: "Daily attendance" },
    ],
    provides: {
      badge: "JMT",
      title: "What JMT provides",
      items: [
        "Workers matched to the trades you need",
        "The right mix of skilled workers and helpers",
        "A JMT supervisor on site",
        "Daily attendance and headcount report",
        "PPE for every worker",
        "Replacements when a worker doesn’t suit",
        "Wages paid on time, with statutory filings handled",
      ],
    },
    yours: {
      badge: "You",
      title: "What your site provides",
      items: ["Site access and work instructions from your engineer", "Drinking water", "A rest area", "A first aid point"],
      agreed: { label: "Agreed per site", text: "Accommodation, transport and food" },
    },
  },

  roles: {
    copy: {
      eyebrow: "Roles",
      heading: { lead: "Roles we", accent: "supply" },
      intro: "Tick the roles you need. They’re added to your request below.",
    },
    trades: [
      {
        id: "masonry",
        name: "Masonry",
        image: IMAGES.worker,
        roles: [
          { id: "mason", name: "Mason", level: "Skilled" },
          { id: "mason-helper", name: "Mason helper", level: "Semi-skilled" },
        ],
      },
      {
        id: "shuttering",
        name: "Shuttering and rebar",
        image: IMAGES.shuttering,
        roles: [
          { id: "bar-bender", name: "Bar bender", level: "Skilled" },
          { id: "shuttering-carpenter", name: "Shuttering carpenter", level: "Skilled" },
          { id: "bar-bending-helper", name: "Bar-bending helper", level: "Semi-skilled" },
          { id: "scaffolder", name: "Scaffolder", level: "Semi-skilled" },
        ],
      },
      {
        id: "welding",
        name: "Welding and services",
        image: IMAGES.welding,
        roles: [
          { id: "welder", name: "Welder", level: "Skilled" },
          { id: "rigger", name: "Rigger", level: "Semi-skilled" },
          { id: "electrician", name: "Electrician", level: "Skilled" },
          { id: "plumber", name: "Plumber", level: "Skilled" },
        ],
      },
      {
        id: "helpers",
        name: "Helpers and material",
        image: IMAGES.helpers,
        roles: [
          { id: "general-helper", name: "General helper", level: "Unskilled" },
          { id: "loading", name: "Loading and unloading", level: "Unskilled" },
          { id: "site-cleaning", name: "Site cleaning", level: "Unskilled" },
        ],
      },
    ],
    preselected: ["mason", "bar-bender"],
    summary: "{n} roles selected: {list}",
    summaryShort: "{n} selected: {list}",
    emptySummary: "No roles selected yet",
    continueCta: "Continue to request",
    continueShort: "Continue",
  },

  crew: {
    copy: {
      eyebrow: "Your crew",
      heading: { lead: "Every worker is", accent: "checked", tail: "before your site sees them." },
      intro:
        "We don’t send whoever is free. Each crew is put together for your work, checked, and briefed before day one.",
    },
    checks: [
      {
        icon: "hammer",
        label: "Check 01",
        title: "Skill check",
        text: "Trade workers show the task they’ll do before they’re confirmed: a mason lays, a bar bender cuts and bends.",
      },
      {
        icon: "id",
        label: "Check 02",
        title: "ID verification",
        text: "Identity and address are checked and kept on file for every worker.",
      },
      {
        icon: "info",
        label: "Check 03",
        title: "Site induction",
        text: "Safety rules, site hazards and who to report to, explained in Bengali or Hindi.",
      },
      {
        icon: "hat",
        label: "Check 04",
        title: "PPE issued",
        text: "Helmet, safety shoes, vest and gloves, issued and logged per worker.",
      },
      {
        icon: "user",
        label: "Check 05",
        title: "Crew lead assigned",
        text: "One JMT supervisor runs attendance, discipline and daily coordination with your engineer.",
      },
    ],
    clearedLabel: "Cleared for site",
    sample: {
      image: IMAGES.helpers,
      caption: "4 workers + 1 crew lead",
      kicker: "What you get before day one",
      title: "Your crew list, every check ticked",
      stamp: "Sample",
      columns: { worker: "Worker", trade: "Trade", checks: ["Skill", "ID", "Induction", "PPE"] },
      checksShort: "Skill · ID · Ind · PPE",
      workers: [
        { name: "Worker 01", trade: "Mason" },
        { name: "Worker 02", trade: "Bar bender" },
        { name: "Worker 03", trade: "Bar bender" },
        { name: "Worker 04", trade: "General helper" },
      ],
      lead: { title: "Crew lead: JMT supervisor (sample)", duties: "Attendance · discipline · daily coordination" },
      cta: "See a sample crew list",
      note: "Sample with dummy names.",
    },
  },

  plans: {
    copy: {
      eyebrow: "Start small",
      heading: { lead: "How you can", accent: "engage us" },
      intro: "Try us on one work front first. Every site is quoted on its own, so there are no prices here.",
    },
    labels: {
      suits: "Who it suits",
      how: "How it works",
      rate: "Rate depends on trades, crew size, shift and location.",
    },
    plans: [
      {
        name: "Pilot crew",
        duration: "1–2 weeks",
        highlight: "Start here",
        suits: "Contractors trying JMT for the first time.",
        how: "A small crew on one work front. Judge the work, then decide.",
        image: IMAGES.shuttering,
      },
      {
        name: "Monthly crew",
        duration: "Ongoing",
        suits: "Sites that need a steady headcount month after month.",
        how: "A fixed core crew; headcount adjusted with notice.",
        image: IMAGES.monthly,
      },
      {
        name: "Project crew",
        duration: "Fixed scope",
        suits: "A defined job such as a structure, a pour sequence or a finishing phase.",
        how: "Crew planned for the scope and released when it’s done.",
        image: IMAGES.project,
      },
    ],
  },

  steps: {
    copy: {
      eyebrow: "How it works",
      heading: { lead: "What happens after you", accent: "enquire" },
      intro: "From your first message to a working crew.",
    },
    steps: [
      {
        timing: "Day 0",
        title: "Share your requirement",
        text: "Tell us the roles, crew size and start date by call or WhatsApp.",
        image: IMAGES.requirement,
      },
      {
        timing: "Within 48 hours",
        title: "Site visit and crew plan",
        text: "We inspect the site and send a written crew plan with rates.",
        image: IMAGES.newStructure,
      },
      {
        timing: "From Day 3",
        title: "Crew on site",
        text: "Checked, inducted workers arrive in PPE with their JMT supervisor.",
        image: IMAGES.monthly,
      },
      {
        timing: "Ongoing",
        title: "Crew managed for you",
        text: "Attendance, headcount changes and replacements handled by your supervisor.",
        image: IMAGES.replacing,
      },
    ],
  },

  faq: {
    copy: {
      eyebrow: "FAQs",
      heading: { lead: "Questions about", accent: "this service" },
    },
    card: {
      image: IMAGES.founder,
      kicker: "Still not sure?",
      title: "Talk to Akash before you send a request.",
      role: "Founder and director",
      call: "Call",
      whatsapp: "WhatsApp",
    },
    items: [
      {
        id: "worker-leaves",
        question: "What if a worker leaves mid-project?",
        answer:
          "We replace them within 48 hours. The new worker goes through the same skill check, ID check and induction, and your attendance record carries on without a gap.",
      },
      {
        id: "add-workers",
        question: "How quickly can you add more workers?",
        answer:
          "Usually within 3 days of your request. Larger increases are planned with your engineer so the new workers are checked and inducted before they start.",
      },
      {
        id: "night-shift",
        question: "Can you supply night-shift crews?",
        answer:
          "Yes. We run day and night shifts, each with its own supervisor, attendance record and handover to your site team.",
      },
      {
        id: "day-to-day",
        question: "Who manages the crew day to day?",
        answer:
          "A JMT supervisor on site. They handle attendance, discipline and daily coordination, and take work instructions from your site engineer.",
      },
      {
        id: "tools",
        question: "Do workers bring their own tools?",
        answer:
          "Trade workers bring their basic hand tools. Power tools, machinery and consumables are agreed per site in the crew plan.",
      },
      {
        id: "accommodation",
        question: "Where do workers stay?",
        answer:
          "Accommodation, transport and food are agreed per site. We can arrange them, or the crew can use facilities your site already provides.",
      },
      {
        id: "smallest-crew",
        question: "What’s the smallest crew you take on?",
        answer: "Five workers. A pilot crew of that size is a good way to try us on one work front first.",
      },
      {
        id: "trust",
        question: "You’re a new company. Why should we trust you?",
        answer:
          "Start with a pilot crew and judge the work before committing. You deal with the founder directly, every worker is checked before arrival, and wages and statutory filings are handled on time.",
      },
    ],
  },

  related: {
    copy: {
      eyebrow: "Often booked together",
      heading: { lead: "Related", accent: "services" },
    },
    services: [
      {
        kicker: "Service",
        title: "Supervision and compliance",
        text: "A JMT supervisor and complete monthly records for crews you already have.",
        cta: "View service",
        href: "#contact",
        image: IMAGES.supervision,
      },
      {
        kicker: "Service",
        title: "Skilled trade crews",
        text: "Masons, bar benders, welders and shuttering carpenters for specialised work.",
        cta: "View service",
        href: "#contact",
        image: IMAGES.tradeCrews,
      },
    ],
  },

  contactTitle: "Need a crew next week? Let’s plan it today.",
};
