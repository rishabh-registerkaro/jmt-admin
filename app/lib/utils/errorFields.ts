/**
 * Read properties (name, message, Prisma `code`, …) off a caught value.
 * `catch` bindings are `unknown`; anything that isn't an object yields {}.
 */
export function errorFields(error: unknown): Record<string, unknown> {
  return typeof error === "object" && error !== null
    ? (error as Record<string, unknown>)
    : {};
}
