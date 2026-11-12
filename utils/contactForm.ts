// SHARED FILE — an identical copy lives in jmt-admin/utils/contactForm.ts and
// jmt-frontend/utils/contactForm.ts. Change both together.
//
// Fields and validation for the Contact page "Send an enquiry" form
// (Figma "Contact page — Desktop 1440" 302:158 / "— Mobile 390" 304:55).
// Differs from the homepage form (utils/leadForm.ts): a service choice and a
// free-text note, company and start date required, and no email field.
// Pure functions with no server imports: safe on both client and server.

import { HONEYPOT_FIELD, MAX_HEADCOUNT, validateIndianMobile } from "@/utils/leadForm";

export { HONEYPOT_FIELD, MAX_HEADCOUNT };

export const CONTACT_LEAD_SOURCE = "Contact page — Send an enquiry";

/** "What do you need?" choices. Stored in English whatever the page language. */
export const CONTACT_SERVICES = ["Site labour supply", "Supervision and compliance", "Skilled trade crews"] as const;
export type ContactService = (typeof CONTACT_SERVICES)[number];

export const CONTACT_FIELDS = [
  "service",
  "name",
  "companyName",
  "phone",
  "siteLocation",
  "headcount",
  "startDate",
  "note",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactFormValues = Record<ContactField, string>;

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<ContactField, string>>;
  values: ContactFormValues;
}

const LIMITS: Record<ContactField, number> = {
  service: 60,
  name: 100,
  companyName: 150,
  phone: 20,
  siteLocation: 200,
  headcount: 6,
  startDate: 10,
  note: 1000,
};

export const EMPTY_CONTACT_VALUES: ContactFormValues = {
  service: CONTACT_SERVICES[0],
  name: "",
  companyName: "",
  phone: "",
  siteLocation: "",
  headcount: "",
  startDate: "",
  note: "",
};

export const INITIAL_CONTACT_STATE: ContactFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: EMPTY_CONTACT_VALUES,
};

export function readContactValues(formData: FormData): ContactFormValues {
  const values = { ...EMPTY_CONTACT_VALUES };
  for (const field of CONTACT_FIELDS) {
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim().slice(0, LIMITS[field]) : "";
  }
  return values;
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** One short message per invalid field; an empty object means valid. */
export function validateContact(values: ContactFormValues): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};

  if (!(CONTACT_SERVICES as readonly string[]).includes(values.service)) {
    errors.service = "Choose what you need.";
  }

  if (values.name.length < 2) {
    errors.name = "Enter at least 2 characters.";
  } else if (/\p{N}/u.test(values.name)) {
    // \p{N} also catches Bengali (০–৯) and Devanagari (०–९) digits.
    errors.name = "Name can't contain numbers.";
  }

  if (values.companyName.length < 2) {
    errors.companyName = "Enter your company name.";
  }

  const phoneError = validateIndianMobile(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (values.siteLocation.length < 2) {
    errors.siteLocation = "Enter the site location.";
  }

  const headcount = Number(values.headcount);
  if (!values.headcount) {
    errors.headcount = "Enter how many workers.";
  } else if (!Number.isInteger(headcount) || headcount < 1 || headcount > MAX_HEADCOUNT) {
    errors.headcount = `Enter 1 to ${MAX_HEADCOUNT}.`;
  }

  if (!values.startDate) {
    errors.startDate = "Choose a start date.";
  } else if (!isRealDate(values.startDate)) {
    errors.startDate = "Choose a valid date.";
  }

  return errors;
}
