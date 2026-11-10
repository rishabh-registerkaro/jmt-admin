// Ready-made page templates, ported 1:1 from the JMT frontend
// division pages (travel, technology, education, marketing). Picking one in
// the admin pre-fills the whole form with the live design's content so a page
// is aligned with the frontend from the first save.

import {
  emptyServicePageContent,
  type ServicePageContent,
} from "./service-content";

export type ServiceTemplateDef = {
  key: string;
  name: string;
  description: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  content: ServicePageContent;
};

const travel: ServicePageContent = {
  breadcrumb: [
    { label: "Home", href: "/" },
    { label: "Divisions", href: "/travel" },
    { label: "Travel & Tourism" },
  ],
  badge: "TRAVEL & TOURISM",
  badgeIcon: "Plane",
  titleLead: "Explore the world with",
  titleAccent: "complete confidence",
  subtitle:
    "JMT makes international travel simple, seamless and memorable — from destination selection to travel documentation. Personalized solutions for individuals, families, students, business and corporate travellers.",
  chips: [
    { icon: "Globe", title: "120+", sub: "Global destinations" },
    { icon: "ShieldCheck", title: "End-to-End", sub: "Full trip support" },
    { icon: "BadgeCheck", title: "Visa", sub: "Documentation help" },
  ],
  formTitle: "Plan your trip",
  formSubtitle:
    "Share your details and our travel expert will call you back within one business hour.",
  formCountries: [
    "Europe",
    "Asia",
    "Middle East",
    "Australia & New Zealand",
    "USA & Canada",
    "Africa",
    "Southeast Asia",
    "Other",
  ],
  formCountryLabel: "Preferred Region",
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "Overview",
      kind: "intro",
      paragraphs: [
        "At JMT, we make international travel simple, seamless and memorable. Our expert travel assistance helps individuals, families, students, business travellers and corporate clients plan their global journeys with complete support — from destination selection to travel documentation.",
        "Whether you are planning a relaxing holiday, a business trip, a family vacation or an international experience, we provide personalized travel solutions designed around your requirements, budget and preferences.",
      ],
      stats: [
        { icon: "Globe", value: "120+", label: "Destinations covered" },
        { icon: "ShieldCheck", value: "End-to-end", label: "Travel assistance" },
        { icon: "BadgeCheck", value: "Visa", label: "Documentation support" },
      ],
    },
    {
      id: "services",
      label: "Our Services",
      heading: "Our international travel services",
      kind: "cards",
      intro:
        "Whether it's a relaxing holiday, a business trip or a study tour, we plan every detail for a hassle-free journey.",
      cards: [
        {
          icon: "Plane",
          title: "International Holiday Packages",
          points: [
            "Sightseeing tours & family vacations",
            "Honeymoon & luxury experiences",
            "Adventure & cultural heritage tours",
            "Group travel packages",
          ],
        },
        {
          icon: "Compass",
          title: "Customized Travel Planning",
          points: [
            "Itineraries by purpose & duration",
            "Budget & destination tailored",
            "Accommodation preferences",
            "Curated local experiences",
          ],
        },
        {
          icon: "BadgeCheck",
          title: "Visa & Documentation",
          points: [
            "Tourist & business visa assistance",
            "Student travel documentation",
            "Travel insurance guidance",
            "Embassy appointment guidance",
          ],
        },
        {
          icon: "BedDouble",
          title: "Flight & Accommodation",
          points: [
            "International flight bookings",
            "Hotel reservations",
            "Airport transfers",
            "Local transportation",
          ],
        },
        {
          icon: "Briefcase",
          title: "Corporate & Business Travel",
          points: [
            "Business travel planning",
            "International meeting arrangements",
            "Executive travel solutions",
            "Group business travel management",
          ],
        },
        {
          icon: "GraduationCap",
          title: "Student & Educational Travel",
          points: [
            "Education travel assistance",
            "University visit programs",
            "Study tour planning",
            "Cultural exchange support",
          ],
        },
      ],
    },
    {
      id: "destinations",
      label: "Destinations",
      heading: "Popular destinations across the globe",
      kind: "chips",
      intro:
        "We help you explore breathtaking destinations across all major regions of the world.",
      chipIcon: "MapPin",
      chips: [
        "Europe",
        "Asia",
        "Middle East",
        "Australia & New Zealand",
        "USA & Canada",
        "Africa",
        "Southeast Asia",
      ],
      note: "Visa approval remains subject to embassy and immigration authority decisions.",
    },
    {
      id: "process",
      label: "How It Works",
      heading: "How it works",
      kind: "steps",
      intro: "A simple, guided process from first enquiry to a memorable trip.",
      steps: [
        {
          title: "Share your travel plans",
          text: "Tell us your destination, dates, budget and preferences — we listen first.",
        },
        {
          title: "Get a tailored itinerary",
          text: "Our experts craft a personalized plan covering flights, stays and experiences.",
        },
        {
          title: "Documentation & booking",
          text: "We assist with visa documentation, bookings and travel insurance.",
        },
        {
          title: "Travel with confidence",
          text: "Enjoy your journey with end-to-end support before and during your trip.",
        },
      ],
    },
    {
      id: "why",
      label: "Why Choose Us",
      heading: "Why choose JMT",
      kind: "checklist",
      items: [
        "Personalized travel solutions",
        "Professional documentation support",
        "Transparent communication",
        "End-to-end travel assistance",
        "Customized itineraries",
        "Customer-focused service approach",
      ],
    },
    {
      id: "faq",
      label: "FAQs",
      heading: "Frequently asked questions",
      kind: "faq",
      faqs: [
        {
          q: "Do you guarantee visa approval?",
          a: "No. We provide documentation and appointment guidance, but visa approval remains subject to the embassy and immigration authority's decision.",
        },
        {
          q: "Can you plan a fully customized trip?",
          a: "Yes — every itinerary is built around your purpose, duration, budget, preferred destinations and the local experiences you want.",
        },
        {
          q: "Do you handle corporate and group travel?",
          a: "Absolutely. We manage business travel, international meetings, executive travel and group business travel end-to-end.",
        },
        {
          q: "What support do students get?",
          a: "We assist with education travel, university visit programs, study tours and cultural exchange travel support.",
        },
      ],
    },
  ],
};

const technology: ServicePageContent = {
  breadcrumb: [
    { label: "Home", href: "/" },
    { label: "Divisions", href: "/technology" },
    { label: "AI & Technology" },
  ],
  badge: "AI & TECHNOLOGY",
  badgeIcon: "Cpu",
  titleLead: "Smarter business with",
  titleAccent: "AI & automation",
  subtitle:
    "JMT helps organizations adopt AI, automate operations and unlock insights from their data — practical technology solutions that drive real business outcomes.",
  chips: [
    { icon: "Bot", title: "AI Training", sub: "Team enablement" },
    { icon: "Cpu", title: "Automation", sub: "Efficient operations" },
    { icon: "BarChart", title: "Analytics", sub: "Actionable insights" },
  ],
  formTitle: "Enquire now",
  formSubtitle:
    "Share your details and our technology team will call you back within one business hour.",
  formCountries: [
    "AI Training",
    "Business Automation",
    "Data Analytics",
    "Not sure yet",
  ],
  formCountryLabel: "I'm interested in",
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "Overview",
      kind: "intro",
      paragraphs: [
        "JMT's AI & Technology division helps organizations adopt AI, automate operations and unlock insights from their data.",
        "We deliver practical technology solutions — training, automation and analytics — designed to create real, measurable business outcomes.",
      ],
      stats: [
        { icon: "Bot", value: "AI", label: "Training & enablement" },
        { icon: "Cpu", value: "Automation", label: "Operational efficiency" },
        { icon: "ShieldCheck", value: "Analytics", label: "Data-driven insight" },
      ],
    },
    {
      id: "services",
      label: "Our Services",
      heading: "AI & technology services",
      kind: "cards",
      intro:
        "A growing suite of AI and automation services for modern businesses.",
      cards: [
        {
          icon: "Bot",
          title: "AI Training",
          points: [
            "AI awareness & upskilling programs",
            "Team enablement workshops",
            "Practical AI tool adoption",
            "Custom training tracks",
          ],
        },
        {
          icon: "Cpu",
          title: "Business Automation",
          points: [
            "Workflow & process automation",
            "Repetitive-task elimination",
            "System & tool integration",
            "Operational efficiency gains",
          ],
        },
        {
          icon: "BarChart",
          title: "Data Analytics Services",
          points: [
            "Business intelligence dashboards",
            "Data collection & processing",
            "Actionable performance insights",
            "Reporting & visualization",
          ],
        },
      ],
    },
    {
      id: "why",
      label: "Why Choose Us",
      heading: "Why choose JMT",
      kind: "checklist",
      items: [
        "Practical, outcome-focused solutions",
        "Experienced technology team",
        "Tailored to your operations",
        "Transparent communication",
        "Scalable implementations",
        "Ongoing support",
      ],
    },
    {
      id: "faq",
      label: "FAQs",
      heading: "Frequently asked questions",
      kind: "faq",
      faqs: [
        {
          q: "Do I need technical staff to work with you?",
          a: "No. We meet you where you are — from AI awareness training to hands-on automation and analytics, with support throughout.",
        },
        {
          q: "What can you automate?",
          a: "Workflows and repetitive tasks, plus system and tool integrations that improve operational efficiency.",
        },
        {
          q: "How does the analytics service work?",
          a: "We collect and process your data, then deliver business intelligence dashboards and actionable performance insights.",
        },
      ],
    },
  ],
};

const education: ServicePageContent = {
  breadcrumb: [
    { label: "Home", href: "/" },
    { label: "Divisions", href: "/education" },
    { label: "Education & Career" },
  ],
  badge: "EDUCATION & CAREER",
  badgeIcon: "GraduationCap",
  titleLead: "Learn, grow and build",
  titleAccent: "a global career",
  subtitle:
    "JMT supports students and professionals with training, overseas education guidance and career services — helping you take the next step across borders with confidence.",
  chips: [
    { icon: "GraduationCap", title: "Overseas", sub: "Education support" },
    { icon: "BadgeCheck", title: "Training", sub: "Skill development" },
    { icon: "Briefcase", title: "Careers", sub: "Job-readiness" },
  ],
  formTitle: "Enquire now",
  formSubtitle:
    "Share your details and our education advisor will call you back within one business hour.",
  formCountries: [
    "Overseas Education",
    "Training & Skills",
    "Career Services",
    "Not sure yet",
  ],
  formCountryLabel: "I'm interested in",
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "Overview",
      kind: "intro",
      paragraphs: [
        "JMT's Education & Career division helps students and professionals reach their goals — from studying abroad to building international, future-ready careers.",
        "We guide you through training, overseas education and career services with clear, transparent, personalized support at every step.",
      ],
      stats: [
        { icon: "Globe", value: "Overseas", label: "Education guidance" },
        { icon: "BadgeCheck", value: "Training", label: "Skill development" },
        { icon: "ShieldCheck", value: "Careers", label: "Job-ready support" },
      ],
    },
    {
      id: "services",
      label: "Our Services",
      heading: "Education & career services",
      kind: "cards",
      intro:
        "A growing set of programs to help you study, upskill and advance internationally.",
      cards: [
        {
          icon: "GraduationCap",
          title: "Overseas Education Support",
          points: [
            "University shortlisting & guidance",
            "Application & admission support",
            "Study-abroad documentation",
            "Country & course counselling",
          ],
        },
        {
          icon: "BadgeCheck",
          title: "Training & Skill Development",
          points: [
            "Professional training programs",
            "Skill-building workshops",
            "Certification guidance",
            "Language & test preparation",
          ],
        },
        {
          icon: "Briefcase",
          title: "Career Services",
          points: [
            "Career counselling",
            "Resume & interview preparation",
            "International job-readiness support",
            "Placement guidance",
          ],
        },
      ],
    },
    {
      id: "why",
      label: "Why Choose Us",
      heading: "Why choose JMT",
      kind: "checklist",
      items: [
        "Personalized guidance",
        "Transparent communication",
        "End-to-end support",
        "Experienced advisors",
        "Student-focused approach",
        "Global opportunities",
      ],
    },
    {
      id: "faq",
      label: "FAQs",
      heading: "Frequently asked questions",
      kind: "faq",
      faqs: [
        {
          q: "Do you help with studying abroad?",
          a: "Yes — from university shortlisting and applications to study-abroad documentation and course counselling.",
        },
        {
          q: "What training programs do you offer?",
          a: "Professional training, skill-building workshops, certification guidance and language / test preparation.",
        },
        {
          q: "Can you help with my career?",
          a: "We provide career counselling, resume and interview preparation, job-readiness support and placement guidance.",
        },
      ],
    },
  ],
};

const marketing: ServicePageContent = {
  breadcrumb: [
    { label: "Home", href: "/" },
    { label: "Divisions", href: "/marketing" },
    { label: "Marketing & AI" },
  ],
  badge: "MARKETING & AI",
  badgeIcon: "Sparkles",
  titleLead: "Transforming businesses through",
  titleAccent: "AI-driven marketing",
  subtitle:
    "We combine advanced Artificial Intelligence, digital marketing expertise and global advertising strategies to help businesses build stronger brands, reach international customers and achieve sustainable growth.",
  chips: [
    { icon: "Bot", title: "AI-Powered", sub: "Automation & insights" },
    { icon: "Globe", title: "Global", sub: "Audience reach" },
    { icon: "Target", title: "Results", sub: "Data-driven growth" },
  ],
  formTitle: "Grow your business",
  formSubtitle:
    "Share your details and our marketing expert will call you back within one business hour.",
  formCountries: [
    "Travel & Tourism",
    "Education & Training",
    "Healthcare",
    "Real Estate",
    "Startup / SME",
    "E-commerce",
    "Professional Services",
    "Other",
  ],
  formCountryLabel: "Your Industry",
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "Overview",
      kind: "intro",
      paragraphs: [
        "At JMT, we combine advanced Artificial Intelligence, digital marketing expertise and global advertising strategies to help businesses build stronger brands, reach international customers and achieve sustainable growth.",
        "Our AI-powered marketing solutions help organizations understand customer behaviour, automate marketing processes, create engaging content and optimize advertising performance across global markets.",
      ],
      stats: [
        { icon: "Bot", value: "AI-first", label: "Marketing automation" },
        { icon: "BarChart", value: "Data-driven", label: "Decision making" },
        { icon: "Globe", value: "Global", label: "Audience reach" },
      ],
    },
    {
      id: "services",
      label: "Our Services",
      heading: "Our AI-powered marketing services",
      kind: "cards",
      intro:
        "From automation to analytics and creative — intelligent marketing across every global market.",
      cards: [
        {
          icon: "Bot",
          title: "AI Marketing Automation",
          points: [
            "AI-powered marketing workflows",
            "Automated customer engagement",
            "AI chatbots & virtual assistants",
            "Lead nurturing & CRM",
          ],
        },
        {
          icon: "Globe",
          title: "Global Digital Marketing",
          points: [
            "Global brand promotion",
            "Social media & SEO / SEM",
            "Online advertising campaigns",
            "Digital reputation management",
          ],
        },
        {
          icon: "BarChart",
          title: "Insights & Analytics",
          points: [
            "Customer preferences & trends",
            "Buying behaviour analysis",
            "Campaign performance tracking",
            "Customer segmentation",
          ],
        },
        {
          icon: "Sparkles",
          title: "Content & Creative",
          points: [
            "Marketing content & social posts",
            "Ad copywriting & blogs",
            "Promotional videos",
            "AI-assisted design & storytelling",
          ],
        },
        {
          icon: "Megaphone",
          title: "AI-Powered Advertising",
          points: [
            "Intelligent campaign planning",
            "Audience analysis",
            "Conversion optimization",
            "Automated campaign insights",
          ],
        },
        {
          icon: "Rocket",
          title: "Business Growth",
          points: [
            "Digital presence development",
            "International market research",
            "Online lead generation",
            "Customer acquisition strategies",
          ],
        },
      ],
    },
    {
      id: "industries",
      label: "Industries",
      heading: "Industries we serve",
      kind: "chips",
      intro: "Our AI-powered marketing works across a wide range of sectors.",
      chipIcon: "Target",
      chips: [
        "Travel & Tourism",
        "Education & Training",
        "Healthcare & Medical",
        "Real Estate",
        "Startups & SMEs",
        "E-commerce",
        "Professional Services",
        "Export & Import",
      ],
    },
    {
      id: "process",
      label: "How It Works",
      heading: "How it works",
      kind: "steps",
      intro: "A clear, data-driven path from strategy to measurable results.",
      steps: [
        {
          title: "Discovery & strategy",
          text: "We analyse your business, audience and goals to shape an AI-driven marketing strategy.",
        },
        {
          title: "Build & automate",
          text: "We set up campaigns, automation, content and advertising tailored to your market.",
        },
        {
          title: "Optimize with AI",
          text: "AI-driven analytics track performance and continuously optimize your campaigns.",
        },
        {
          title: "Scale & grow",
          text: "We expand what works to grow reach, leads and revenue across global markets.",
        },
      ],
    },
    {
      id: "why",
      label: "Why Choose Us",
      heading: "Why choose JMT",
      kind: "checklist",
      items: [
        "AI-powered marketing strategies",
        "Global audience reach",
        "Data-driven decision making",
        "Creative & technology-based solutions",
        "Customized business growth plans",
        "Focus on measurable results",
      ],
    },
    {
      id: "faq",
      label: "FAQs",
      heading: "Frequently asked questions",
      kind: "faq",
      faqs: [
        {
          q: "What makes your marketing 'AI-powered'?",
          a: "We use AI across automation, customer insights, content creation and advertising — so campaigns are smarter, more personalized and continuously optimized.",
        },
        {
          q: "Do you work with small businesses and startups?",
          a: "Yes. We serve startups and SMEs alongside larger organizations, with customized growth plans for each.",
        },
        {
          q: "Can you handle international campaigns?",
          a: "Absolutely — international audience targeting and global brand promotion are core to what we do.",
        },
        {
          q: "How do you measure success?",
          a: "Through data-driven analytics: campaign performance, conversions, lead generation and other measurable business outcomes.",
        },
      ],
    },
  ],
};

export const SERVICE_TEMPLATES: ServiceTemplateDef[] = [
  {
    key: "blank",
    name: "Blank page",
    description: "Start from scratch with an empty division layout.",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    content: emptyServicePageContent(),
  },
  {
    key: "travel",
    name: "Travel & Tourism",
    description: "Matches the frontend /travel division page.",
    slug: "travel",
    metaTitle: "Travel & Tourism — JMT",
    metaDescription:
      "International holiday packages, customized travel planning, visa assistance, corporate and student travel — JMT's Travel & Tourism division.",
    content: travel,
  },
  {
    key: "technology",
    name: "AI & Technology",
    description: "Matches the frontend /technology division page.",
    slug: "technology",
    metaTitle: "AI & Technology Solutions — JMT",
    metaDescription:
      "AI training, business automation and data analytics services from JMT's AI & Technology division.",
    content: technology,
  },
  {
    key: "education",
    name: "Education & Career",
    description: "Matches the frontend /education division page.",
    slug: "education",
    metaTitle: "Education & Career Solutions — JMT",
    metaDescription:
      "Training, overseas education support and career services from JMT's Education & Career division.",
    content: education,
  },
  {
    key: "marketing",
    name: "Marketing & AI",
    description: "Matches the frontend /marketing division page.",
    slug: "marketing",
    metaTitle: "Marketing & AI — JMT",
    metaDescription:
      "AI-powered marketing automation, global digital marketing, customer analytics, content and advertising — JMT's Marketing & AI division.",
    content: marketing,
  },
];
