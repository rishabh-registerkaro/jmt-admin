// SHARED FILE — an identical copy lives in jmt-admin/utils/joinForm.ts and
// jmt-frontend/utils/joinForm.ts. Change both together.
//
// Fields and validation for the Join our crew page "Your application" form
// (Figma "Join our crew — Desktop 1440" 311:2 / "— Mobile 390" 313:2).
// Choices are stored in English whatever the page language.
// Pure functions with no server imports: safe on both client and server.

import { HONEYPOT_FIELD, validateIndianMobile } from "@/utils/leadForm";

export { HONEYPOT_FIELD };

export const JOIN_LEAD_SOURCE = "Join our crew — Worker application";

export const JOIN_TRADES = [
  "Mason",
  "Bar bender",
  "Shuttering carpenter",
  "Welder",
  "Electrician",
  "Plumber",
  "Scaffolder",
  "Rigger",
  "General helper",
  "Site supervisor",
  "Other",
] as const;

export const JOIN_EXPERIENCE = ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"] as const;

/** Languages a worker speaks (several may be chosen). */
export const JOIN_LANGUAGES = ["Bengali", "Hindi", "English"] as const;

export const JOIN_START = ["Now", "In 1 week", "In 1 month"] as const;

export const JOIN_FIELDS = ["name", "phone", "trade", "experience", "location", "languages", "start", "consent"] as const;
export type JoinField = (typeof JOIN_FIELDS)[number];

/** `languages` is the chosen languages joined with ", "; `consent` is "yes" or "". */
export type JoinFormValues = Record<JoinField, string>;

export interface JoinFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<JoinField, string>>;
  values: JoinFormValues;
}

const LIMITS: Record<Exclude<JoinField, "languages">, number> = {
  name: 100,
  phone: 20,
  trade: 40,
  experience: 40,
  location: 120,
  start: 40,
  consent: 3,
};

export const EMPTY_JOIN_VALUES: JoinFormValues = {
  name: "",
  phone: "",
  trade: "",
  experience: "",
  location: "",
  languages: "",
  start: "",
  consent: "",
};

export const INITIAL_JOIN_STATE: JoinFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: EMPTY_JOIN_VALUES,
};

const oneOf = (list: readonly string[], value: string) => list.includes(value);

export function readJoinValues(formData: FormData): JoinFormValues {
  const values = { ...EMPTY_JOIN_VALUES };
  for (const field of JOIN_FIELDS) {
    if (field === "languages") continue;
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim().slice(0, LIMITS[field]) : "";
  }
  // Checkboxes: keep only known languages, in the fixed order, once each.
  const chosen = new Set(formData.getAll("languages").filter((v): v is string => typeof v === "string"));
  values.languages = JOIN_LANGUAGES.filter((language) => chosen.has(language)).join(", ");
  values.consent = values.consent === "yes" ? "yes" : "";
  return values;
}

/** One short message per invalid field; an empty object means valid. */
export function validateJoin(values: JoinFormValues): Partial<Record<JoinField, string>> {
  const errors: Partial<Record<JoinField, string>> = {};

  if (values.name.length < 2) {
    errors.name = "Enter at least 2 characters.";
  } else if (/\p{N}/u.test(values.name)) {
    // \p{N} also catches Bengali (০–৯) and Devanagari (०–९) digits.
    errors.name = "Name can't contain numbers.";
  }

  const phoneError = validateIndianMobile(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (!oneOf(JOIN_TRADES, values.trade)) errors.trade = "Choose your trade.";
  if (!oneOf(JOIN_EXPERIENCE, values.experience)) errors.experience = "Choose your experience.";

  if (values.location.length < 2) errors.location = "Enter your district or town.";

  if (!values.languages) errors.languages = "Choose at least one language.";

  // Optional, but must be one of the choices when given.
  if (values.start && !oneOf(JOIN_START, values.start)) errors.start = "Choose when you can start.";

  if (values.consent !== "yes") errors.consent = "Please tick this box so we can call you.";

  return errors;
}
