/**
 * Parse an integer query param. Non-numeric input ("abc", "") returns the
 * fallback instead of NaN — NaN reaches Prisma's skip/take and fails the
 * request with a 500.
 */
export function intParam(raw: string | null | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}
