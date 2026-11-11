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
  email: 254,
  siteLocation: 200,
  headcount: 6,
  startDate: 10,
};

export const EMPTY_LEAD_VALUES: LeadFormValues = {
  companyName: "",
  name: "",
  phone: "",
  email: "",
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

// ── Contact validation ───────────────────────────────────────────────────────
// Each validator returns `null` when the value is valid, otherwise one specific,
// user-facing message. Pure functions: safe on both client and server.
// Keep messages short (≈30 characters): the homepage form shows them on a
// single fixed-height line under each field so the layout never shifts.

/** Checks, in order, for a 10-digit Indian mobile number starting with 5–9. */
export const PHONE_ERRORS = {
  required: "Mobile number is required.",
  characters: "Use digits only.",
  length: "Must be 10 digits.",
  start: "Must start with 5, 6, 7, 8 or 9.",
} as const;

/**
 * Indian mobile number → the bare 10 digits, or the reason it isn't one.
 * Accepts the ways people actually type it: "98765 43210", "98765-43210",
 * "+91 98765 43210", "91 9876543210", "09876543210".
 */
export function validateIndianMobile(input: string): string | null {
  const value = input.trim();
  if (!value) return PHONE_ERRORS.required;

  // Separators people type; a single leading "+" is allowed for the country code.
  const compact = value.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(compact)) return PHONE_ERRORS.characters;

  let digits = compact.replace(/^\+/, "");
  // Strip a country code (+91 / 91) or trunk prefix (0) only when what's left is 10 digits,
  // so a genuine 10-digit number starting with 9 is never mangled.
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 10) return PHONE_ERRORS.length;
  if (!/^[5-9]/.test(digits)) return PHONE_ERRORS.start;
  return null;
}

export const EMAIL_ERRORS = {
  required: "Email is required.",
  spaces: "Remove the spaces.",
  at: "Use one @, like name@site.com",
  local: "Add your name before the @.",
  domain: "Check the part after the @.",
  dots: "Check the dots in your email.",
  tooLong: "Email is too long.",
  format: "Enter a valid email.",
} as const;

// Deliberately permissive local part (anything but whitespace and @, which
// covers +tags, dots and international characters); stricter domain: labels of
// letters, digits or inner hyphens, ending in an alphabetic TLD of 2+ letters.
const EMAIL_DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const EMAIL_RE = /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/** Valid email → null; otherwise the most specific reason it's invalid. */
export function validateEmail(input: string): string | null {
  const value = input.trim();
  if (!value) return EMAIL_ERRORS.required;
  if (value.length > 254) return EMAIL_ERRORS.tooLong;
  if (/\s/.test(value)) return EMAIL_ERRORS.spaces;

  const parts = value.split("@");
  if (parts.length !== 2) return EMAIL_ERRORS.at;
  const [local, domain] = parts;

  if (!local) return EMAIL_ERRORS.local;
  if (local.length > 64) return EMAIL_ERRORS.tooLong;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return EMAIL_ERRORS.dots;
  if (!domain || !EMAIL_DOMAIN_RE.test(domain)) return EMAIL_ERRORS.domain;

  // Belt and braces: the full pattern must also match.
  return EMAIL_RE.test(value) ? null : EMAIL_ERRORS.format;
}

/** Boolean convenience wrappers. */
export const isValidIndianMobile = (phone: string) => validateIndianMobile(phone) === null;
export const isValidEmail = (email: string) => validateEmail(email) === null;

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Returns one message per invalid field; an empty object means valid. */
export function validateLead(values: LeadFormValues): Partial<Record<LeadField, string>> {
  const errors: Partial<Record<LeadField, string>> = {};

  if (values.name.length < 2) {
    errors.name = "Enter at least 2 characters.";
  } else if (/\p{N}/u.test(values.name)) {
    // \p{N} also catches Bengali (০–৯) and Devanagari (०–९) digits.
    errors.name = "Name can't contain numbers.";
  }

  const phoneError = validateIndianMobile(values.phone);
  if (phoneError) errors.phone = phoneError;

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (values.siteLocation.length < 2) {
    errors.siteLocation = "Enter the site location.";
  }

  const headcount = Number(values.headcount);
  if (!values.headcount) {
    errors.headcount = "Enter how many workers.";
  } else if (!Number.isInteger(headcount) || headcount < 1 || headcount > MAX_HEADCOUNT) {
    errors.headcount = `Enter 1 to ${MAX_HEADCOUNT}.`;
  }

  if (values.startDate && !isRealDate(values.startDate)) {
    errors.startDate = "Choose a valid date.";
  }

  return errors;
}
