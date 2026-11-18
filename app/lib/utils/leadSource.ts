import { JOIN_LEAD_SOURCE } from "@/utils/joinForm";

// MySQL compares leadSource case- and accent-insensitively, so a plain `===`
// would miss values the database treats as the Join Our Crew source.
const fold = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").trim().toLowerCase();

/**
 * True if the database would treat this value as the Join Our Crew source.
 * Applications are permission-separated from leads by this source, so it can
 * only be set by the verified /api/lead/join route.
 */
export function isJoinSource(value: unknown): boolean {
  return typeof value === "string" && fold(value) === fold(JOIN_LEAD_SOURCE);
}
