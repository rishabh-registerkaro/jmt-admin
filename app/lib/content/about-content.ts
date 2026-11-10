// Shared content model for the About Us page.
//
// Mirrors the JMT frontend About page section-for-section, with icons
// stored as string names (resolved to components on the frontend via
// app/components/aboutpage/icons). The whole page lives in one JSON column, so
// copy/field changes never require a schema migration.

// Icon names exported by JMT/app/components/aboutpage/icons.tsx
export const ABOUT_ICON_NAMES = [
  "Award",
  "BadgeCheck",
  "Building2",
  "CalendarCheck",
  "Feather",
  "Globe2",
  "Landmark",
  "Lock",
  "Mail",
  "Scale",
  "Share2",
  "ShieldCheck",
  "Star",
  "Truck",
  "UserRound",
] as const;

export type AboutIconName = (typeof ABOUT_ICON_NAMES)[number] | (string & {});

export type AboutPageContent = {
  hero: {
    badge: string;
    titleLead: string;
    /** Rendered in the gold gradient */
    titleAccent: string;
    subtitle: string;
    ctaPrimary: { text: string; url: string };
    ctaSecondary: { text: string; url: string };
    chips: { icon: AboutIconName; label: string }[];
    /** The "Get a free quote" lead-capture card */
    form: { kicker: string; title: string; services: string[]; note: string };
  };
  /** Trust metrics strip under the hero */
  metrics: { value: string; suffix: string; label: string; sub: string }[];
  pillars: {
    kicker: string;
    heading: string;
    intro: string;
    items: { icon: AboutIconName; title: string; points: string[] }[];
  };
  accreditations: {
    heading: string;
    intro: string;
    items: { icon: AboutIconName; title: string; sub: string }[];
  };
  story: {
    kicker: string;
    headingLead: string;
    /** Rendered italic in purple */
    headingAccent: string;
    intro: string;
    /** Floating badge on the photo (e.g. "Est. 2009" / "New Delhi, India") */
    badgeTitle: string;
    badgeSub: string;
    timeline: { year: string; title: string; desc: string; dark?: boolean }[];
  };
  team: {
    kicker: string;
    headingLead: string;
    headingAccent: string;
    intro: string;
    members: {
      name: string;
      role: string;
      desc: string;
      photo: string;
      // social links — the frontend only shows an icon when a value is set
      email?: string;
      linkedin?: string;
      instagram?: string;
    }[];
  };
  founder: {
    kicker: string;
    heading: string;
    name: string;
    role: string;
    experience: string;
    quote: string;
    signature: string;
  };
};

/**
 * The live frontend content, used to seed the database and to prefill the
 * dashboard editor when the page is empty.
 */
export function defaultAboutContent(): AboutPageContent {
  return {
    hero: {
      badge: "OUR HERITAGE & MISSION",
      titleLead: "Securing your global transitions with",
      titleAccent: "absolute integrity",
      subtitle:
        "JMT is a premium cross-border legal-logistics desk operating directly alongside the Ministry of External Affairs. For over fifteen years we have turned the maze of state departments, central ministries and foreign consulates into a single, accountable chain of custody — so your documents move with the same precision your ambitions demand.",
      ctaPrimary: { text: "Start Application", url: "/contact" },
      ctaSecondary: { text: "Our Process", url: "/services" },
      chips: [
        { icon: "Star", label: "4.9 / 5 rated" },
        { icon: "CalendarCheck", label: "15+ years" },
        { icon: "BadgeCheck", label: "MEA-registered" },
      ],
      form: {
        kicker: "GET A FREE QUOTE",
        title: "Start your application",
        services: [
          "MEA Apostille",
          "Embassy Attestation",
          "Certified Translation",
          "HRD / SDM Verification",
          "Corporate Legalization",
        ],
        note: "100% confidential • Reply within 1 business hour",
      },
    },
    metrics: [
      { value: "15", suffix: "+", label: "Years", sub: "Corporate track record" },
      { value: "120", suffix: "+", label: "Countries", sub: "Global Hague networks" },
      { value: "500K", suffix: "+", label: "Documents", sub: "Successfully authenticated" },
      { value: "0", suffix: "%", label: "Margin", sub: "Error-tolerance compliance" },
    ],
    pillars: {
      kicker: "OUR OPERATING PILLARS",
      heading: "The chain of trust",
      intro:
        "Three commitments that hold every document we handle to a single, uncompromising standard.",
      items: [
        {
          icon: "Scale",
          title: "Strict Legal Compliance",
          points: [
            "Zero-exception document screening",
            "Notary verification to international statutory guidelines",
            "Continuous legal & policy updates",
          ],
        },
        {
          icon: "Truck",
          title: "Tamper-Proof Logistics",
          points: [
            "Insured, 24/7 tracked transit pipelines",
            "Secure document vaults under CCTV",
            "Strict chain-of-custody handoffs",
          ],
        },
        {
          icon: "Lock",
          title: "Absolute Confidentiality",
          points: [
            "Corporate NDA protections",
            "Encrypted client-data infrastructure",
            "Strict citizen privacy management",
          ],
        },
      ],
    },
    accreditations: {
      heading: "Recognized standards & frameworks",
      intro:
        "Audited adherence to the bodies that govern secure, lawful document handling.",
      items: [
        { icon: "ShieldCheck", title: "ISO 27001", sub: "Information Security" },
        { icon: "Landmark", title: "MEA Outward Desk", sub: "Direct Processing" },
        { icon: "Building2", title: "Chamber of Commerce", sub: "Compliance Member" },
        { icon: "Globe2", title: "Hague Convention", sub: "Apostille Framework" },
      ],
    },
    story: {
      kicker: "OUR STORY",
      headingLead: "From a single desk to a",
      headingAccent: "global network",
      intro:
        "What began as a one-room legalization desk in New Delhi has grown into a nationwide logistics network trusted by families, students and corporations to move their most important documents across borders — without a single compromise on integrity.",
      badgeTitle: "Est. 2009",
      badgeSub: "New Delhi, India",
      timeline: [
        {
          year: "2009",
          title: "The first desk opens",
          desc: "Founded in Connaught Place to simplify document attestation for a handful of local clients.",
        },
        {
          year: "2014",
          title: "Direct MEA integration",
          desc: "Became a registered partner of the Ministry of External Affairs outward processing desk.",
        },
        {
          year: "2019",
          title: "250,000 documents",
          desc: "Crossed a quarter-million authenticated documents with regional hubs in four cities.",
        },
        {
          year: "2024",
          title: "120+ country network",
          desc: "Today, a global consular network legalizing documents for over 120 destinations.",
          dark: true,
        },
      ],
    },
    team: {
      kicker: "OUR PEOPLE",
      headingLead: "The people behind the",
      headingAccent: "seal",
      intro:
        "A specialist team that treats every document as if it were their own passport.",
      members: [
        {
          name: "Meera Iyer",
          role: "Head of MEA Operations",
          desc: "Oversees direct ministry submissions and apostille turnaround across all hubs.",
          photo: "/assets/about-team-1.jpg",
        },
        {
          name: "Rajat Sehgal",
          role: "Director, Consular Affairs",
          desc: "Leads embassy and non-Hague attestation across the UAE, KSA and Qatar desks.",
          photo: "/assets/about-team-2.jpg",
        },
        {
          name: "Fatima Sheikh",
          role: "Head of Client Success",
          desc: "Your single point of contact, keeping every case transparent from pickup to return.",
          photo: "/assets/about-team-3.jpg",
        },
        {
          name: "Arjun Rao",
          role: "Head of Secure Logistics",
          desc: "Runs the insured, CCTV-tracked transit pipelines and chain-of-custody vaults.",
          photo: "/assets/about-team-4.jpg",
        },
      ],
    },
    founder: {
      kicker: "LEADERSHIP",
      heading: "A word from our founder",
      name: "A. R. Khanna",
      role: "Founder & Managing Director",
      experience: "15+ years in cross-border legal logistics",
      quote:
        "True global mobility requires a foundation of absolute legal trust. We built JMT to turn complex international bureaucracies into a secure, flawless day-to-day operation.",
      signature: "JMT",
    },
  };
}

export const ABOUT_META_DEFAULTS = {
  metaTitle: "About Us — JMT",
  metaDescription:
    "JMT is a premium cross-border legal-logistics desk operating alongside the Ministry of External Affairs — 15+ years, 120+ countries, absolute integrity.",
};
