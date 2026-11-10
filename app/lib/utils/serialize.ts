/**
 * Serialization helpers to preserve the MongoDB-era API contract.
 *
 * The frontend reads `_id` everywhere, so every row returned from Prisma is
 * mapped `id` -> `_id` before being sent in a JSON response. Only known
 * relation keys are mapped recursively — JSON content blobs (additionalFields,
 * menus, page sections) are passed through untouched so any `id` keys inside
 * user content are never rewritten.
 */

type Row = Record<string, unknown> & { id?: unknown };

const RELATION_KEYS = [
  "author",
  "categories",
  "category",
  "parent",
  "parentCategory",
  "package",
  "children",
] as const;

export function withMongoId<T extends Row | null | undefined>(
  row: T
): Record<string, unknown> | null {
  if (row == null) return null;
  const { id, ...rest } = row as Row;
  const out: Record<string, unknown> = id !== undefined ? { _id: id, ...rest } : { ...rest };

  for (const key of RELATION_KEYS) {
    const val = out[key];
    if (Array.isArray(val)) {
      out[key] = val.map((v) =>
        v && typeof v === "object" ? withMongoId(v as Row) : v
      );
    } else if (val && typeof val === "object" && !(val instanceof Date)) {
      out[key] = withMongoId(val as Row);
    }
  }
  return out;
}

export function withMongoIds<T extends Row>(
  rows: T[] | null | undefined
): Array<Record<string, unknown> | null> {
  if (!rows) return [];
  return rows.map((r) => withMongoId(r));
}
