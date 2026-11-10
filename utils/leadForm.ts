// SHARED FILE — an identical copy lives in jmt-admin/utils/leadForm.ts and
// jmt-frontend/utils/leadForm.ts. Change both together.
//
// Validation for the homepage "Send us your requirement" form.
// Pure functions with no server imports, so the rules live in one place and
// mirror the phone/name checks in app/api/lead/route.ts.

import { LEAD_FIELDS, type LeadField, type LeadFormState, type LeadFormValues } from "@/types/homepage";

export const LEAD_SOURCE = "Homepage — Request workers";

/** Hidden field real visitors never fill; bots that do are silently dropped. */
// Non-semantic on purpose: a name like "website" gets browser-autofilled, which
// would make real visitors trip the honeypot and silently lose their lead.
export const HONEYPOT_FIELD = "jmt_hp_ref";

export const MAX_HEADCOUNT = 5000;

const LIMITS: Record<LeadField, number> = {
  companyName: 150,
  name: 100,
  phone: 20,
  siteLocation: 200,
  headcount: 6,
  startDate: 10,
};

export const EMPTY_LEAD_VALUES: LeadFormValues = {
  companyName: "",
  name: "",
  phone: "",
  siteLocation: "",
  headcount: "",
  startDate: "",
};

export const INITIAL_LEAD_STATE: LeadFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: EMPTY_LEAD_VALUES,
};

export function readLeadValues(formData: FormData): LeadFormValues {
  const values = { ...EMPTY_LEAD_VALUES };
  for (const field of LEAD_FIELDS) {
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim().slice(0, LIMITS[field]) : "";
  }
  return values;
}

function phoneDigits(phone: string): string {
  return phone.replace(/[\s\-().]/g, "").replace(/^\+/, "");
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Returns one message per invalid field; an empty object means valid. */
export function validateLead(values: LeadFormValues): Partial<Record<LeadField, string>> {
  const errors: Partial<Record<LeadField, string>> = {};

  if (values.name.length < 2) {
    errors.name = "Please enter your name (at least 2 characters).";
  }

  if (!values.phone) {
    errors.phone = "Please enter a phone or WhatsApp number.";
  } else if (!/^\d{7,15}$/.test(phoneDigits(values.phone))) {
    errors.phone = "Please enter a valid phone number (7–15 digits).";
  }

  if (values.siteLocation.length < 2) {
    errors.siteLocation = "Please tell us where the site is.";
  }

  const headcount = Number(values.headcount);
  if (!values.headcount) {
    errors.headcount = "Please enter how many workers you need.";
  } else if (!Number.isInteger(headcount) || headcount < 1 || headcount > MAX_HEADCOUNT) {
    errors.headcount = `Enter a whole number between 1 and ${MAX_HEADCOUNT}.`;
  }

  if (values.startDate && !isRealDate(values.startDate)) {
    errors.startDate = "Please choose a valid start date.";
  }

  return errors;
}
