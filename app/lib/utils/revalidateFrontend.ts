// Fire-and-forget cache invalidation on the frontend (JMT website).
// Called automatically after service page mutations so creates, edits and
// deletes show on the live site immediately — no manual "revalidate" needed.

// Hosting dashboards often end up with surrounding quotes or stray whitespace
// pasted into env values (dotenv strips quotes, dashboard UIs don't). Normalize
// so both sides compare the same secret regardless.
export const normalizeSecret = (v: string | null | undefined) =>
  (v ?? "").trim().replace(/^['"]|['"]$/g, "");

export async function revalidateFrontendTags(tags: string[]): Promise<void> {
  const FRONTEND_URL = process.env.PRODUCTION_URL || "http://localhost:3001";
  try {
    await fetch(`${FRONTEND_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": normalizeSecret(process.env.REVALIDATE_SECRET),
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    // Never fail the mutation because the frontend cache couldn't be cleared —
    // the admin can still use the manual revalidate button.
    console.log("Frontend revalidation failed:", error);
  }
}

export const serviceTags = (slug: string) => ["service-list", `service-${slug}`];

/**
 * A package block is injected into other pages, so clearing it must clear every
 * page it targets — plus `package-list` for anything listing blocks. On rename
 * or retarget, pass the union of the old and new target pages.
 */
export const packageTags = (targetPages: string[]) => [
  "package-list",
  ...targetPages.filter(Boolean).map((p) => `packages-${p}`),
];
