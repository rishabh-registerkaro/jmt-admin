// Thank-you page copy — /thank-you, one version each for the Request workers form,
// the Contact page enquiry and the Join our crew application.
// Visitors land here after a form is sent (lib/thankYou.ts).
//
// Not here, because editors already change them elsewhere:
//   • the pill and the message under the heading: each form's success title
//     and success message (Homepage → Contact, Contact → Enquiry form,
//     Join Our Crew → Application form);
//   • the steps: Contact → "What happens next" (contractors) and
//     Join Our Crew → "How hiring works" (workers);
//   • phone, WhatsApp and hours: Homepage → Contact details.
//
// This is the bundled default: the copy is edited in jmt-admin (Dashboard →
// Thank You) and merged over it (server/sitePages.ts).

export const THANK_YOU_PAGE = {
  meta: {
    title: "Thank you | Joy Maa Tara",
    description: "Your details reached the Joy Maa Tara team. Here is what happens next.",
  },

  hero: {
    /** "Thank you, Rahul." — the visitor's first name is added when known. */
    greeting: "Thank you",
    /** Orange line under the greeting. */
    contractorAccent: "We’re on it.",
    workerAccent: "Your application is in.",
  },

  summary: {
    requestTitle: "What you sent us",
    applicationTitle: "Your application",
    /** "12 workers" */
    workers: "workers",
    /** "From 1 Dec 2026" */
    from: "From",
    /** "Can start: Now" */
    canStart: "Can start:",
    note: "Something not right? Just tell us when we call.",
  },

  progress: {
    eyebrow: "After you send",
    title: { lead: "Here’s", accent: "what happens next", tail: "." },
    doneWhen: "Just now",
    doneRequest: "Request received",
    doneApplication: "Application received",
    doneText: "Saved and passed to our team.",
    /** Badge label on the workers' steps: "STEP 02". */
    stepLabel: "STEP",
  },

  ready: {
    /** Contractors only; workers see "Keep ready" from the Join our crew page. */
    label: "Keep these handy for our call",
    items: [
      "Site address and how to reach it",
      "Roles and how many of each",
      "Shift pattern and working hours",
      "Start date and how long you need the crew",
      "Site photos or drawings, if you have them",
    ],
  },

  actions: {
    eyebrow: "Need it sooner?",
    title: { lead: "Talk to us", accent: "right now", tail: "." },
    callLabel: "CALL US",
    whatsappLabel: "WHATSAPP",
    /** Contractors; workers see the Join our crew form's WhatsApp text. */
    whatsappText: "Send site photos or details",
    /** Pre-typed WhatsApp message for contractors. */
    whatsappDraft: "Hi JMT, I just sent a request on your website. Sharing my site details here.",
    saveLabel: "SAVE OUR NUMBER",
    saveText: "So you know it’s us when we call",
  },

  explore: {
    title: "While you wait",
    text: "Take a look around. Our team will be in touch soon.",
    home: "Back to homepage",
    links: [
      { label: "Our services", href: "/#services" },
      { label: "Sites we staff", href: "/#sites" },
      { label: "About JMT", href: "/about" },
    ],
    workerLinks: [
      { label: "How hiring works", href: "/join-our-crew#how-hiring-works" },
      { label: "About JMT", href: "/about" },
    ],
  },
};

export type ThankYouPageContent = typeof THANK_YOU_PAGE;
