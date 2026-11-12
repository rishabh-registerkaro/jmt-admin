// Bundled About page copy — Figma "JMT" → "About page — Desktop 1440" (289:2)
// and "About page — Mobile 390" (296:2). Where the mobile frame shortens a
// line, it is the `short` of a Copy (types/about.ts).
//
// This is the bundled default: the copy is edited in jmt-admin (Dashboard →
// About Us) and merged over it (server/sitePages.ts).

import type { HomeImage } from "@/types/homepage";
import type { AboutPageContent } from "@/types/about";

const photo = (file: string, alt: string, width: number, height: number, focus?: HomeImage["focus"]): HomeImage => ({
  src: `/about/${file}`,
  alt,
  width,
  height,
  ...(focus ? { focus } : {}),
});

export const ABOUT_PAGE: AboutPageContent = {
  meta: {
    title: "About Joy Maa Tara Bama Kripa — Site crews from West Bengal",
    description:
      "Joy Maa Tara Bama Kripa supplies supervised, fully compliant site crews for bridges, metro, buildings and roads. Founder-led, from West Bengal.",
  },

  hero: {
    pill: {
      text: "About Joy Maa Tara · Labour contractor, West Bengal",
      short: "About Joy Maa Tara · West Bengal",
    },
    heading: { lead: "The people behind the", accent: "crews that build your site", tail: "." },
    subtitle:
      "Joy Maa Tara Bama Kripa supplies site crews for bridges, metro, buildings and roads. We started with one rule: crews turn up as planned, and every paper is ready before anyone asks for it.",
    primaryCta: "Meet the founder",
    secondaryCta: "Our services",
    mission: {
      pill: "OUR MISSION",
      title: "No site held up for lack of crew.",
      text: {
        text: "We exist so contractors never lose a day waiting for hands. Every crew is matched to the work, checked, and briefed before it reaches your gate, with a JMT supervisor who answers to your engineer.",
        short:
          "Every crew is matched to the work, checked, and briefed before it reaches your gate, with a JMT supervisor who answers to your engineer.",
      },
      servicesTitle: "What we do today",
      liveBadge: { text: "3 services live", short: "3 live" },
      liveLabel: "Live",
      soonLabel: "Coming soon",
      services: [
        {
          icon: "users",
          title: "Site labour supply",
          text: "Skilled, semi-skilled and unskilled crews, supervised on site.",
          live: true,
        },
        {
          icon: "shield",
          title: "Supervision and compliance",
          text: "A JMT supervisor and monthly records for crews you already have.",
          live: true,
        },
        {
          icon: "hat",
          title: "Skilled trade crews",
          text: "Masons, bar benders, welders and shuttering carpenters.",
          live: true,
        },
        { icon: "factory", title: "Industrial manpower", text: "Crews for plants and factories.", live: false },
      ],
    },
  },

  sites: {
    caption: "Built for the sites contractors find hardest to staff",
    sites: [
      { icon: "bridge", label: { text: "Bridges and flyovers", short: "Bridges" } },
      { icon: "train", label: { text: "Metro viaducts", short: "Metro" } },
      { icon: "station", label: { text: "Stations and depots", short: "Stations" } },
      { icon: "building", label: { text: "Buildings" } },
      { icon: "road", label: { text: "Roads and site works", short: "Roads" } },
    ],
  },

  trades: {
    heading: { lead: "Supply", accent: "every trade", tail: " your site needs, from one contractor." },
    intro: {
      text: "From a single crew to a full site team: one partner for sourcing, checking, supervision and the monthly paperwork.",
      short: "One partner for sourcing, checking, supervision and the monthly paperwork.",
    },
    rows: [
      [
        { label: "Mason" },
        { label: "Bar bender" },
        { label: "Shuttering carpenter" },
        { label: "Welder" },
        { label: "Electrician" },
        { label: "Plumber" },
        { label: "Scaffolder" },
        { label: "Rigger" },
      ],
      [
        { label: "Mason helper" },
        { label: "Bar-bending helper" },
        { label: "JMT site supervisor", lead: true },
        { label: "General helper" },
        { label: "Loading and unloading" },
        { label: "Site cleaning" },
        { label: "Mason" },
        { label: "Bar bender" },
      ],
      [
        { label: "Scaffolder" },
        { label: "Site cleaning" },
        { label: "Mason helper" },
        { label: "Electrician" },
        { label: "Loading and unloading" },
        { label: "Plumber" },
        { label: "JMT site supervisor" },
        { label: "General helper" },
      ],
    ],
    roles: [
      { label: "Mason" },
      { label: "Bar bender" },
      { label: "Shuttering carpenter" },
      { label: "Welder" },
      { label: "Electrician" },
      { label: "Plumber" },
      { label: "Scaffolder" },
      { label: "Rigger" },
      { label: "Mason helper" },
      { label: "Bar-bending helper" },
      { label: "General helper" },
      { label: "Loading and unloading" },
      { label: "Site cleaning" },
      { label: "JMT site supervisor", lead: true },
    ],
    cta: "See all roles",
  },

  values: {
    pill: "What we stand for",
    heading: { lead: "Values written", accent: "on site, not on walls", tail: "." },
    values: [
      {
        icon: "phone",
        title: "Owner on every call",
        text: "You deal with the founder directly, not a call centre. Decisions are made the same day.",
        proof: "Founder answers every enquiry",
      },
      {
        icon: "file",
        title: "Compliance you can show",
        text: "PF, ESIC, wage proof and licence copies shared every month, ready for your auditor.",
        proof: "Records shared every month",
      },
      {
        icon: "hat",
        title: "Construction crews only",
        text: "Bridges, metro, buildings and roads. That’s all we staff, so our supervisors know your site.",
        proof: "One focus: civil and infrastructure",
      },
    ],
  },

  team: {
    copy: {
      eyebrow: "WHO YOU DEAL WITH",
      heading: { lead: "Run by people who", accent: "work the sites", tail: "." },
      intro:
        "Every crew answers to a JMT supervisor, and every supervisor answers to the founder. No call centre in between.",
      introShort: "Every crew answers to a JMT supervisor, and every supervisor answers to the founder.",
    },
    founder: {
      image: photo("person-founder.webp", "Akash Gupta, founder of Joy Maa Tara Bama Kripa", 960, 1438, "upper"),
      tag: "Founder",
      name: "Akash Gupta",
      text: { text: "Founder and Director. Visits your site and agrees the crew plan." },
    },
    people: [
      {
        image: photo("person-supervisors.webp", "Two JMT site supervisors checking drawings on site", 1260, 840),
        name: "Site supervisors",
        text: { text: "One on every crew. Runs attendance and daily coordination.", short: "One on every crew." },
      },
      {
        image: photo("person-crews.webp", "A JMT crew in hard hats on site", 1499, 840),
        name: "Our crews",
        text: { text: "Skilled, semi-skilled and helpers, checked before day one.", short: "Checked before day one." },
      },
    ],
    join: {
      title: "Want to work on our sites?",
      text: {
        text: "We hire skilled workers, helpers and supervisors.",
        short: "Skilled workers, helpers and supervisors.",
      },
      cta: "Join our crew",
    },
    quote: {
      text: "“Every enquiry comes to me directly. I visit your site, agree the crew plan with you, and stay your single point of contact for as long as we work together.”",
      name: "Akash Gupta",
      role: "Founder",
    },
  },

  standards: {
    copy: {
      eyebrow: "OUR STANDARDS",
      heading: { lead: "What every worker gets, and", accent: "every site can check", tail: "." },
      intro: "The same checks for every crew, whether it’s five workers or fifty.",
      introShort: null,
    },
    headlines: [
      { title: "ID-checked", text: "Before day one" },
      { title: "Inducted", text: "In Bengali or Hindi" },
      { title: "In PPE", text: "Issued and logged" },
      { title: "Paid right", text: "At or above minimum wage" },
    ],
    details: [
      { icon: "hammer", title: "Skill check", text: "Trade workers show the task they’ll do before they’re confirmed." },
      {
        icon: "flag",
        title: "Crew lead",
        text: "One JMT supervisor runs attendance, discipline and coordination with your engineer.",
      },
      { icon: "cal", title: "Daily attendance", text: "Headcount recorded every day and shared with your site." },
      { icon: "file", title: "Monthly filings", text: "PF, ESIC and wage records shared every month for your file." },
    ],
  },

  promises: {
    pill: "OUR PROMISES",
    title: "Built crew by crew, from West Bengal.",
    text: {
      text: "We’re a young company, so we don’t lead with big numbers. We lead with promises we keep on every site, and you can hold us to each one.",
      short: "We’re a young company, so we don’t lead with big numbers. We lead with promises we keep on every site.",
    },
    assurances: ["PF and ESIC filed monthly", "Minimum wages paid", "Attendance kept daily"],
    promises: [
      { value: "5+", unit: "workers", label: { text: "Smallest crew we take on", short: "Smallest crew" } },
      { value: "3", unit: "days", label: { text: "Notice to start a crew", short: "Notice to start" } },
      { value: "48", unit: "hours", label: { text: "To replace a worker" } },
      { value: "2", unit: "hours", label: { text: "Reply time on working days", short: "Reply time" } },
    ],
  },

  recovery: {
    copy: {
      eyebrow: "WHEN SOMETHING GOES WRONG",
      heading: { lead: "One call, one person,", accent: "fixed in writing", tail: "." },
      intro: "Problems happen on every site. What matters is how fast they’re owned and how clearly they’re closed.",
      introShort: null,
    },
    steps: [
      { title: "You raise it", text: "Call or WhatsApp your JMT supervisor, or the founder directly." },
      { title: "Supervisor acts", text: "The issue is checked on site the same day, with your engineer." },
      { title: "Fixed or replaced", text: "The worker is corrected or replaced, and attendance carries on." },
      { title: "Closed in writing", text: "You get a short note of what happened and what changed." },
    ],
    facts: [
      { value: "48 hours", label: "to replace a worker who doesn’t suit" },
      { value: "1 supervisor", label: "on every crew, every shift" },
      { value: "Founder", label: "on call for anything that escalates" },
    ],
  },

  where: {
    copy: {
      eyebrow: "WHERE WE WORK",
      heading: { lead: "Based in", accent: "West Bengal", tail: ", on the sites that need us." },
      intro: "One base, one owner, and supervisors who travel to your site.",
      introShort: null,
    },
    base: {
      eyebrow: "OUR BASE",
      title: "West Bengal, India",
      // Placeholder text from the Figma frame — replace with the head office address.
      address: "Head office address to add",
      hours: "Mon to Sat, 8 am to 8 pm",
    },
    siteEyebrow: "SITE TYPE",
    sites: [
      {
        image: photo("site-bridges.webp", "Steel bridge over a river at dusk", 1280, 720),
        title: "Bridges and flyovers",
        text: "Piers, pile caps, decks, girders",
      },
      {
        image: photo("site-metro.webp", "Elevated metro viaduct on concrete piers", 960, 720),
        title: "Metro viaducts",
        text: "Segments, piers, night shifts",
      },
      {
        image: photo("site-buildings.webp", "City skyline with high-rise buildings", 1080, 720),
        title: "Buildings",
        text: "Structure, masonry, finishing",
      },
    ],
  },

  join: {
    copy: {
      eyebrow: "JOIN OUR CREW",
      heading: { lead: "Work on sites that", accent: "pay right", tail: ", every month." },
      intro: "For workers and supervisors. Wages on time, PF and ESIC, and PPE from day one.",
      introShort: "Wages on time, PF and ESIC, and PPE from day one.",
    },
    perks: ["Wages on time", "PF + ESIC", "PPE"],
    applyCta: "Apply on WhatsApp",
    openings: [
      {
        tag: "Skilled",
        title: "Skilled trades",
        text: "Masons, bar benders, welders, shuttering carpenters, electricians and plumbers.",
      },
      {
        tag: "Semi-skilled · Unskilled",
        title: "Helpers and semi-skilled",
        text: "Mason helpers, bar-bending helpers, scaffolders, riggers and general helpers.",
      },
      {
        tag: "Supervisor",
        title: "Site supervisors",
        text: "Run attendance, safety and daily coordination for a JMT crew on site.",
      },
    ],
  },

  cta: {
    title: "Work with us, from either side of the site.",
    text: "Need a crew, or want to join one? Either way, you’ll talk to the owner.",
    primaryCta: "Request workers",
    secondaryCta: "Join our crew",
  },
};
