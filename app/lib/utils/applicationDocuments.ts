// Files a Join our crew applicant uploaded (CV, letters…), as saved in the
// lead's formData by app/api/lead/join/route.ts. Safe for client and server.

/** formData key holding the list. */
export const DOCUMENTS_KEY = "Documents";

// A type alias (not an interface) so it is assignable to Prisma's JSON input type.
export type ApplicationDocument = {
  /** Stored file name in the private folder (also the URL segment). */
  key: string;
  /** Name the applicant's file had. */
  name: string;
  /** Checked MIME type. */
  type: string;
  bytes: number;
};

/** The documents listed on an application's formData (bad entries dropped). */
export function readApplicationDocuments(formData: unknown): ApplicationDocument[] {
  if (typeof formData !== "object" || formData === null) return [];
  const list = (formData as Record<string, unknown>)[DOCUMENTS_KEY];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (doc): doc is ApplicationDocument =>
      typeof doc === "object" &&
      doc !== null &&
      typeof doc.key === "string" &&
      /^[\w-]+\.[a-z]+$/.test(doc.key) &&
      typeof doc.name === "string" &&
      typeof doc.type === "string" &&
      typeof doc.bytes === "number",
  );
}

/** Admin URL that streams one document (needs applications.view). */
export const applicationDocumentUrl = (applicationId: string, key: string) =>
  `/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(key)}`;
