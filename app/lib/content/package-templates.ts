// Ready-made package blocks offered in the "Add New Package Block" screen, the
// same way SERVICE_TEMPLATES seeds new service pages. Choosing one fills every
// field with on-brand content the admin then edits, so a block looks
// professionally designed from the very first save.

import type { PackageBlockContent, PackageItem } from "./package-content";
import { emptyPackageBlockContent } from "./package-content";

const visaDocs = [
  "Tourist visa filing, appointment & tracking",
  "Passport validity, photo & form compliance check",
  "Travel insurance and forex assistance",
];

const permitDocs = [
  "Government ID & address proof verification",
  "Inner Line Permit / entry permit assistance",
  "Domestic travel insurance assistance",
];

const groupStat = (v: string) => ({ icon: "users", v, k: "Group size" });
const stayStat = (v: string) => ({ icon: "bed-double", v, k: "Accommodation" });
const mealStat = (v: string) => ({ icon: "utensils", v, k: "Meals included" });

const INTERNATIONAL: PackageItem[] = [
  {
    id: "dubai",
    title: "Dubai & Abu Dhabi Signature",
    region: "UAE",
    duration: "5N / 6D",
    season: "Oct – Mar",
    price: "₹64,900",
    old: "₹72,400",
    icon: "building-2",
    band: "gold",
    summary:
      "Skyline landmarks, a desert night and the Grand Mosque — the classic Emirates circuit with visa filing handled end to end by our desk.",
    itinerary: [
      { d: "Day 1", t: "Arrival & Dubai Marina evening", x: "Airport pickup, hotel check-in, then a dhow cruise along Marina with dinner." },
      { d: "Day 2", t: "Burj Khalifa & city highlights", x: "Level 124 observation deck, Dubai Mall fountain show and Old Dubai souks." },
      { d: "Day 3", t: "Red-dune desert safari", x: "Dune bashing, camel ride, henna and a live BBQ dinner under the stars." },
      { d: "Day 4–6", t: "Abu Dhabi day trip & departure", x: "Sheikh Zayed Grand Mosque and Ferrari World, free shopping day, then transfer out." },
    ],
    includes: [
      "5 nights in 4★ hotels with daily breakfast",
      "Return economy airfare from your departure city",
      "All airport, inter-city and sightseeing transfers",
      "Desert safari with BBQ dinner and Burj Khalifa tickets",
    ],
    stats: [groupStat("2–24 pax"), stayStat("4★ stays"), mealStat("Breakfast + 2")],
    docsTitle: "Visa & documents we handle",
    docs: visaDocs,
  },
  {
    id: "bali",
    title: "Bali Island Escape",
    region: "Indonesia",
    duration: "6N / 7D",
    season: "Apr – Oct",
    price: "₹78,500",
    old: "₹86,000",
    icon: "palmtree",
    band: "rose",
    summary:
      "Ubud rice terraces, temple sunsets and Nusa Penida beaches, split between a jungle villa and a beachfront resort.",
    itinerary: [
      { d: "Day 1", t: "Arrival in Denpasar", x: "Private transfer to your Ubud villa and a relaxed evening at leisure." },
      { d: "Day 2–3", t: "Ubud culture circuit", x: "Tegalalang rice terraces, Monkey Forest, Tirta Empul and a Balinese spa session." },
      { d: "Day 4–5", t: "Nusa Penida & Kelingking", x: "Speedboat crossing, Kelingking cliff, Broken Beach and Angel's Billabong." },
      { d: "Day 6–7", t: "Seminyak beach & departure", x: "Tanah Lot sunset, free beach morning, then airport transfer." },
    ],
    includes: [
      "6 nights across a private-pool villa and beach resort",
      "Return economy airfare and visa-on-arrival guidance",
      "Nusa Penida speedboat and full-day island tour",
      "Daily breakfast plus one Balinese dinner experience",
    ],
    stats: [groupStat("2–16 pax"), stayStat("Villa + 4★"), mealStat("Breakfast + 1")],
    docsTitle: "Visa & documents we handle",
    docs: visaDocs,
  },
  {
    id: "singapore",
    title: "Singapore & Malaysia Twin",
    region: "Singapore · Malaysia",
    duration: "6N / 7D",
    season: "Year-round",
    price: "₹92,300",
    old: "₹99,800",
    icon: "ferris-wheel",
    band: "navy",
    summary:
      "A family-first twin-country run pairing Sentosa and Universal Studios with the Genting Highlands and Kuala Lumpur.",
    itinerary: [
      { d: "Day 1", t: "Arrival & Gardens by the Bay", x: "Hotel check-in followed by the Supertree Grove light show." },
      { d: "Day 2–3", t: "Sentosa & Universal Studios", x: "Cable car, S.E.A. Aquarium and a full day at Universal Studios Singapore." },
      { d: "Day 4–5", t: "Coach to Genting Highlands", x: "Scenic transfer, Awana Skyway cable car and the Chin Swee temple." },
      { d: "Day 6–7", t: "Kuala Lumpur & departure", x: "Petronas Towers photo stop, Batu Caves and city shopping before flying home." },
    ],
    includes: [
      "6 nights in centrally located 4★ hotels",
      "Return airfare and inter-country coach transfers",
      "Universal Studios and Gardens by the Bay tickets",
      "Daily breakfast and all listed sightseeing",
    ],
    stats: [groupStat("2–30 pax"), stayStat("4★ stays"), mealStat("Breakfast daily")],
    docsTitle: "Visa & documents we handle",
    docs: visaDocs,
  },
  {
    id: "thailand",
    title: "Bangkok & Phuket Getaway",
    region: "Thailand",
    duration: "5N / 6D",
    season: "Nov – Mar",
    price: "₹52,400",
    old: "₹58,900",
    icon: "waves",
    band: "violet",
    summary:
      "The most requested short-haul break — temples and street food in Bangkok, then island-hopping out of Phuket.",
    itinerary: [
      { d: "Day 1", t: "Arrival in Bangkok", x: "Transfer to hotel and an evening at Asiatique riverfront." },
      { d: "Day 2", t: "Temples & Grand Palace", x: "Wat Pho, Wat Arun and the Grand Palace, then Chatuchak market." },
      { d: "Day 3–4", t: "Fly to Phuket · Phi Phi tour", x: "Domestic flight, then a speedboat day across Phi Phi and Maya Bay." },
      { d: "Day 5–6", t: "James Bond Island & departure", x: "Phang Nga Bay canoeing, free beach evening and airport transfer." },
    ],
    includes: [
      "5 nights in 4★ hotels with breakfast",
      "Return airfare plus the Bangkok–Phuket domestic sector",
      "Phi Phi and Phang Nga Bay speedboat tours",
      "All transfers and entry tickets listed above",
    ],
    stats: [groupStat("2–20 pax"), stayStat("4★ stays"), mealStat("Breakfast daily")],
    docsTitle: "Visa & documents we handle",
    docs: visaDocs,
  },
  {
    id: "europe",
    title: "Switzerland & Paris Grand",
    region: "Schengen Europe",
    duration: "8N / 9D",
    season: "May – Sep",
    price: "₹1,84,000",
    old: "₹1,98,500",
    icon: "mountain-snow",
    band: "plum",
    summary:
      "Alpine peaks, lakeside towns and a Seine finale — with Schengen visa documentation prepared by our legalisation desk.",
    itinerary: [
      { d: "Day 1–2", t: "Zurich arrival & Lucerne", x: "Chapel Bridge, Lion Monument and a Lake Lucerne cruise." },
      { d: "Day 3–4", t: "Mt. Titlis & Interlaken", x: "Rotair cable car to the glacier, then two nights in the Interlaken region." },
      { d: "Day 5–6", t: "Jungfraujoch & TGV to Paris", x: "Top of Europe excursion, then a high-speed rail transfer into Paris." },
      { d: "Day 7–9", t: "Paris & Disneyland", x: "Eiffel Tower, Seine cruise, Louvre exterior and a full Disneyland day." },
    ],
    includes: [
      "8 nights in 3★/4★ hotels with breakfast",
      "Return airfare and Swiss Travel Pass segments",
      "Mt. Titlis, Jungfraujoch and Disneyland Paris tickets",
      "Complete Schengen visa file preparation and appointment",
    ],
    stats: [groupStat("2–26 pax"), stayStat("3★–4★"), mealStat("Breakfast + 3")],
    docsTitle: "Visa & documents we handle",
    docs: visaDocs,
  },
  {
    id: "vietnam",
    title: "Vietnam Heritage Trail",
    region: "Vietnam",
    duration: "6N / 7D",
    season: "Oct – Apr",
    price: "₹68,700",
    old: "₹74,200",
    icon: "sailboat",
    band: "amber",
    summary:
      "Ha Long Bay overnight cruise, the lantern streets of Hoi An and Da Nang's coastline in one relaxed loop.",
    itinerary: [
      { d: "Day 1–2", t: "Hanoi old quarter", x: "Arrival, Hoan Kiem Lake, the Temple of Literature and a street-food walk." },
      { d: "Day 3", t: "Ha Long Bay cruise", x: "Overnight on a deluxe junk with kayaking and a cave visit." },
      { d: "Day 4–5", t: "Fly to Da Nang · Ba Na Hills", x: "Golden Bridge, cable car and Marble Mountains." },
      { d: "Day 6–7", t: "Hoi An & departure", x: "Ancient town lantern evening, tailoring stop and airport transfer." },
    ],
    includes: [
      "6 nights including one Ha Long Bay cruise night",
      "Return airfare and the Hanoi–Da Nang domestic sector",
      "All transfers, cruise meals and listed entry tickets",
      "e-Visa application prepared and filed by our team",
    ],
    stats: [groupStat("2–18 pax"), stayStat("4★ + cruise"), mealStat("Breakfast + 3")],
    docsTitle: "Visa & documents we handle",
    docs: visaDocs,
  },
];

const DOMESTIC: PackageItem[] = [
  {
    id: "kerala",
    title: "Kerala Backwaters & Munnar",
    region: "Kerala",
    duration: "4N / 5D",
    season: "Sep – Mar",
    price: "₹22,800",
    old: "₹26,400",
    icon: "sailboat",
    band: "violet",
    summary:
      "Tea-estate mornings in Munnar followed by a private houseboat night on the Alleppey backwaters.",
    itinerary: [
      { d: "Day 1", t: "Kochi arrival & drive to Munnar", x: "Waterfall stops en route, evening at leisure in the hills." },
      { d: "Day 2", t: "Munnar plantations", x: "Tea museum, Eravikulam National Park and Mattupetty Dam." },
      { d: "Day 3", t: "Thekkady spice route", x: "Periyar lake boating and a spice plantation walk." },
      { d: "Day 4–5", t: "Alleppey houseboat & departure", x: "Private houseboat with all meals, then transfer to Kochi airport." },
    ],
    includes: [
      "4 nights including one full houseboat stay",
      "All transfers by private air-conditioned vehicle",
      "Daily breakfast plus houseboat lunch and dinner",
      "All listed entry tickets and boating charges",
    ],
    stats: [groupStat("2–12 pax"), stayStat("3★ + houseboat"), mealStat("Breakfast + 2")],
    docsTitle: "Permits & documents we handle",
    docs: permitDocs,
  },
  {
    id: "kashmir",
    title: "Kashmir Valley Retreat",
    region: "Jammu & Kashmir",
    duration: "5N / 6D",
    season: "Mar – Oct",
    price: "₹31,500",
    old: "₹35,900",
    icon: "mountain-snow",
    band: "navy",
    summary:
      "Dal Lake shikara evenings, the Gulmarg gondola and the meadows of Pahalgam on a paced six-day circuit.",
    itinerary: [
      { d: "Day 1", t: "Srinagar arrival", x: "Mughal gardens tour and a sunset shikara ride on Dal Lake." },
      { d: "Day 2", t: "Gulmarg day trip", x: "Gondola phase one and open meadows with snow views." },
      { d: "Day 3–4", t: "Pahalgam & Betaab Valley", x: "Aru and Chandanwari sightseeing by local taxi." },
      { d: "Day 5–6", t: "Sonmarg & departure", x: "Thajiwas glacier approach, houseboat night, then airport transfer." },
    ],
    includes: [
      "5 nights including one Dal Lake houseboat night",
      "Private vehicle for all transfers and sightseeing",
      "Daily breakfast and dinner at the hotel",
      "Shikara ride and Gulmarg gondola phase-one tickets",
    ],
    stats: [groupStat("2–14 pax"), stayStat("Hotel + houseboat"), mealStat("Breakfast + dinner")],
    docsTitle: "Permits & documents we handle",
    docs: permitDocs,
  },
  {
    id: "rajasthan",
    title: "Rajasthan Heritage Circuit",
    region: "Rajasthan",
    duration: "6N / 7D",
    season: "Oct – Mar",
    price: "₹28,900",
    old: "₹33,200",
    icon: "landmark",
    band: "amber",
    summary:
      "Jaipur, Jodhpur and Udaipur end to end — forts, stepwells and a lake-palace sunset, all by private car.",
    itinerary: [
      { d: "Day 1–2", t: "Jaipur pink city", x: "Amber Fort, Hawa Mahal, City Palace and Jantar Mantar." },
      { d: "Day 3–4", t: "Jodhpur blue city", x: "Mehrangarh Fort, Jaswant Thada and the old clock-tower bazaar." },
      { d: "Day 5–6", t: "Udaipur lakes", x: "City Palace, Lake Pichola boat ride and Saheliyon ki Bari." },
      { d: "Day 7", t: "Departure", x: "Free morning for shopping, then transfer to Udaipur airport." },
    ],
    includes: [
      "6 nights in heritage-style 3★/4★ properties",
      "Private air-conditioned car across all three cities",
      "Daily breakfast and one traditional folk dinner",
      "Monument entry tickets and a licensed local guide",
    ],
    stats: [groupStat("2–16 pax"), stayStat("Heritage 3★–4★"), mealStat("Breakfast + 1")],
    docsTitle: "Permits & documents we handle",
    docs: permitDocs,
  },
  {
    id: "andaman",
    title: "Andaman Island Escape",
    region: "Andaman & Nicobar",
    duration: "5N / 6D",
    season: "Oct – May",
    price: "₹41,200",
    old: "₹46,700",
    icon: "palmtree",
    band: "rose",
    summary:
      "Radhanagar sunsets, Elephant Beach snorkelling and a Havelock ferry run, with island permits arranged for you.",
    itinerary: [
      { d: "Day 1", t: "Port Blair arrival", x: "Corbyn's Cove and the Cellular Jail light-and-sound show." },
      { d: "Day 2–3", t: "Havelock Island", x: "Cruise transfer, Radhanagar Beach sunset and Elephant Beach snorkelling." },
      { d: "Day 4", t: "Neil Island", x: "Bharatpur and Laxmanpur beaches with the natural rock bridge." },
      { d: "Day 5–6", t: "Ross Island & departure", x: "Ross and North Bay glass-bottom boat, then airport transfer." },
    ],
    includes: [
      "5 nights across Port Blair, Havelock and Neil",
      "Return airfare and all inter-island cruise tickets",
      "Daily breakfast and all island transfers",
      "Snorkelling session and listed entry permits",
    ],
    stats: [groupStat("2–14 pax"), stayStat("3★–4★"), mealStat("Breakfast daily")],
    docsTitle: "Permits & documents we handle",
    docs: permitDocs,
  },
  {
    id: "ladakh",
    title: "Leh – Ladakh Expedition",
    region: "Ladakh",
    duration: "6N / 7D",
    season: "Jun – Sep",
    price: "₹38,600",
    old: "₹43,500",
    icon: "tent",
    band: "plum",
    summary:
      "Pangong and Nubra with proper acclimatisation days built in, plus Inner Line Permits filed by our desk.",
    itinerary: [
      { d: "Day 1–2", t: "Leh arrival & acclimatisation", x: "Rest day, then Shanti Stupa, Leh Palace and the local market." },
      { d: "Day 3–4", t: "Nubra Valley via Khardung La", x: "Sand dunes at Hunder, double-humped camel ride, monastery visit." },
      { d: "Day 5", t: "Pangong Tso", x: "Drive via Shyok with an overnight camp stay by the lake." },
      { d: "Day 6–7", t: "Thiksey, Hemis & departure", x: "Monastery circuit and the Sindhu Ghat before your flight out." },
    ],
    includes: [
      "6 nights including one Pangong camp stay",
      "All transfers in a Ladakh-registered SUV with driver",
      "Daily breakfast and dinner throughout",
      "Inner Line Permits and oxygen support on board",
    ],
    stats: [groupStat("2–10 pax"), stayStat("Hotel + camp"), mealStat("Breakfast + dinner")],
    docsTitle: "Permits & documents we handle",
    docs: permitDocs,
  },
  {
    id: "goa",
    title: "Goa Coastal Break",
    region: "Goa",
    duration: "3N / 4D",
    season: "Nov – Feb",
    price: "₹16,400",
    old: "₹19,800",
    icon: "waves",
    band: "gold",
    summary:
      "A short, easy coastal reset — north Goa beaches, old Portuguese churches and a Mandovi sunset cruise.",
    itinerary: [
      { d: "Day 1", t: "Arrival & Baga evening", x: "Resort check-in, then Baga and Calangute at your own pace." },
      { d: "Day 2", t: "North Goa circuit", x: "Fort Aguada, Sinquerim, Anjuna flea market and Chapora Fort." },
      { d: "Day 3", t: "Old Goa & river cruise", x: "Basilica of Bom Jesus, Se Cathedral and a Mandovi sunset cruise." },
      { d: "Day 4", t: "Departure", x: "Free beach morning, then transfer to Goa airport." },
    ],
    includes: [
      "3 nights at a north Goa beach resort",
      "Airport transfers and a full-day sightseeing cab",
      "Daily breakfast at the resort",
      "Mandovi river sunset cruise tickets",
    ],
    stats: [groupStat("2–20 pax"), stayStat("Beach resort"), mealStat("Breakfast daily")],
    docsTitle: "Permits & documents we handle",
    docs: permitDocs,
  },
];

export type PackageTemplate = {
  key: string;
  name: string;
  description: string;
  /** Pre-filled block slug (the admin can change it) */
  slug: string;
  title: string;
  /** Page slugs the block is injected into out of the box */
  targetPages: string[];
  content: PackageBlockContent;
};

export const PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    key: "blank",
    name: "Blank block",
    description: "Empty — build your tabs and packages from scratch",
    slug: "",
    title: "",
    targetPages: [],
    content: emptyPackageBlockContent(),
  },
  {
    key: "holiday-tours",
    name: "Holiday Tour Packages",
    description: "International + Domestic tabs, 12 ready-written packages",
    slug: "holiday-tour-packages",
    title: "Holiday Tour Packages",
    targetPages: ["travel"],
    content: {
      ...emptyPackageBlockContent(),
      anchorId: "packages",
      tocLabel: "Tour Packages",
      badge: "INTERNATIONAL & DOMESTIC TOURISM",
      badgeIcon: "plane",
      heading: "Holiday Tour Packages",
      subtitle:
        "Tap any package and its full itinerary drops down right below it — the list stays put, nothing opens in a new page.",
      tabs: [
        { id: "intl", label: "International", packages: INTERNATIONAL },
        { id: "dom", label: "Domestic", packages: DOMESTIC },
      ],
    },
  },
];
