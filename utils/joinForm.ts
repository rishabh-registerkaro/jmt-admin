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

/** The choice that opens a free-text box (trade and languages). */
export const JOIN_OTHER = "Other";

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
  JOIN_OTHER,
] as const;

export const JOIN_EXPERIENCE = ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"] as const;

/** Languages a worker speaks (several may be chosen). */
export const JOIN_LANGUAGES = ["Bengali", "Hindi", "English", JOIN_OTHER] as const;

export const JOIN_START = ["Now", "In 1 week", "In 1 month"] as const;

/** "Why should we hire you?" is optional and capped in letters (spaces not counted). */
export const WHY_HIRE_MAX_LETTERS = 70;

export const JOIN_FIELDS = [
  "name",
  "phone",
  "trade",
  "tradeOther",
  "experience",
  "location",
  "languages",
  "languageOther",
  "start",
  "whyHire",
] as const;
export type JoinField = (typeof JOIN_FIELDS)[number];
/** Fields that can carry an error message: the text fields plus the uploaded files. */
export type JoinErrorField = JoinField | "documents";

/** `languages` is the chosen languages joined with ", ". */
export type JoinFormValues = Record<JoinField, string>;

export interface JoinFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<JoinErrorField, string>>;
  values: JoinFormValues;
}

const LIMITS: Record<Exclude<JoinField, "languages">, number> = {
  name: 100,
  phone: 20,
  trade: 40,
  tradeOther: 60,
  experience: 40,
  location: 120,
  languageOther: 60,
  start: 40,
  whyHire: 600,
};

export const EMPTY_JOIN_VALUES: JoinFormValues = {
  name: "",
  phone: "",
  trade: "",
  tradeOther: "",
  experience: "",
  location: "",
  languages: "",
  languageOther: "",
  start: "",
  whyHire: "",
};

export const INITIAL_JOIN_STATE: JoinFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: EMPTY_JOIN_VALUES,
};

const oneOf = (list: readonly string[], value: string) => list.includes(value);

/** Characters that count toward the limit: everything except spaces and line breaks. */
export const countLetters = (text: string) => text.replace(/\s/g, "").length;

/** The text cut right after its WHY_HIRE_MAX_LETTERS-th counted character. */
export function limitLetters(text: string, max = WHY_HIRE_MAX_LETTERS): string {
  let counted = 0;
  for (let i = 0; i < text.length; i++) {
    if (!/\s/.test(text[i]) && ++counted === max) return text.slice(0, i + 1);
  }
  return text;
}

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
  // The free-text boxes only count when "Other" is chosen.
  if (values.trade !== JOIN_OTHER) values.tradeOther = "";
  if (!chosen.has(JOIN_OTHER)) values.languageOther = "";
  return values;
}

/** One short message per invalid field; an empty object means valid. */
export function validateJoin(values: JoinFormValues): Partial<Record<JoinErrorField, string>> {
  const errors: Partial<Record<JoinErrorField, string>> = {};

  if (values.name.length < 2) {
    errors.name = "Enter at least 2 characters.";
  } else if (/\p{N}/u.test(values.name)) {
    // \p{N} also catches Bengali (০–৯) and Devanagari (०–९) digits.
    errors.name = "Name can't contain numbers.";
  }

  const phoneError = validateIndianMobile(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (!oneOf(JOIN_TRADES, values.trade)) errors.trade = "Choose your trade.";
  else if (values.trade === JOIN_OTHER && values.tradeOther.length < 2) errors.tradeOther = "Enter your trade.";

  if (!oneOf(JOIN_EXPERIENCE, values.experience)) errors.experience = "Choose your experience.";

  if (values.location.length < 2) errors.location = "Enter your district or town.";

  if (!values.languages) errors.languages = "Choose at least one language.";
  else if (values.languages.split(", ").includes(JOIN_OTHER) && values.languageOther.length < 2) {
    errors.languageOther = "Enter the language you speak.";
  }

  // Optional, but must be one of the choices when given.
  if (values.start && !oneOf(JOIN_START, values.start)) errors.start = "Choose when you can start.";

  if (countLetters(values.whyHire) > WHY_HIRE_MAX_LETTERS) {
    errors.whyHire = `Keep it to ${WHY_HIRE_MAX_LETTERS} letters or fewer (spaces not counted).`;
  }

  return errors;
}

/** "Other: Odia" in place of the bare "Other" choice, for the saved application. */
export function withOtherText(choice: string, otherText: string): string {
  return otherText ? choice.replace(JOIN_OTHER, `${JOIN_OTHER}: ${otherText}`) : choice;
}

// ── Documents (CV, recommendation letters…) ──────────────────────────────
// Optional files sent with the application. Kept small in total so the request
// stays under the 4.5 MB body limit of serverless hosts.

/** Allowed MIME type → the only extension a file of that type is stored with. */
export const JOIN_DOC_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
/** For the file picker. */
export const JOIN_DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
export const JOIN_DOC_MAX_FILES = 3;
export const JOIN_DOC_MAX_TOTAL_BYTES = 4 * 1024 * 1024;

const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** The allowed MIME type of a file (some systems send Word files with no type), or null. */
export function joinDocType(file: { name: string; type: string }): string | null {
  if (Object.hasOwn(JOIN_DOC_TYPES, file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return !file.type || file.type === "application/octet-stream" ? (EXTENSION_TYPES[ext] ?? null) : null;
}

/** The non-empty files sent in the "documents" field. */
export function readJoinDocuments(formData: FormData): File[] {
  return formData.getAll("documents").filter((v): v is File => typeof v !== "string" && v.size > 0);
}

/** An error message for the chosen files, or undefined when they are fine. */
export function validateJoinDocuments(files: readonly { name: string; type: string; size: number }[]): string | undefined {
  if (files.length > JOIN_DOC_MAX_FILES) return `Upload up to ${JOIN_DOC_MAX_FILES} files.`;
  if (files.some((file) => !joinDocType(file))) return "Upload PDF, JPG, PNG or Word files only.";
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > JOIN_DOC_MAX_TOTAL_BYTES) {
    return `Files are too large together (max ${JOIN_DOC_MAX_TOTAL_BYTES / 1024 / 1024} MB).`;
  }
  return undefined;
}
