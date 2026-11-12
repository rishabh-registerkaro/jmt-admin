// Unsaved editor drafts for the "Preview" button (homepage, JMT service pages,
// site pages). Nothing here touches the database: a draft lives in this
// process's memory for a short while, keyed by an unguessable token, and is
// read by jmt-frontend server-to-server (GET /api/preview/[token], guarded by
// REVALIDATE_SECRET) while the editor's browser is in Draft Mode there.
//
// Each Preview session keeps one token; the editor re-sends the draft as the
// user types, bumping `rev`, and the open preview tab re-renders on change.
//
// Limitation: memory is per process. With several jmt-admin instances behind
// a load balancer a preview may land on an instance that doesn't have the
// draft — the frontend then shows the live page and a "preview expired" bar.

import { randomBytes } from "node:crypto";
import type { HomePageContent } from "@/app/lib/content/home-content";
import type { SitePageKey } from "@/app/lib/content/site-pages";
import type { ServicePageContent } from "@/types/service";

export type PreviewDraft =
  | { kind: "homepage"; metaTitle: string | null; metaDescription: string | null; content: HomePageContent }
  | { kind: "service"; slug: string; content: ServicePageContent }
  | { kind: "site-page"; key: SitePageKey; content: unknown };

interface Entry {
  draft: PreviewDraft;
  rev: number;
  ownerId: string;
  expiresAt: number;
}

/** A preview stays readable this long after the editor last sent a change. */
const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;
export const TOKEN_PATTERN = /^[a-f0-9]{32}$/;

// Kept on globalThis so dev hot reloads don't drop open previews.
const globalStore = globalThis as unknown as { __jmtPreviewStore?: Map<string, Entry> };
const store = (globalStore.__jmtPreviewStore ??= new Map<string, Entry>());

function prune(now = Date.now()) {
  for (const [token, entry] of store) if (entry.expiresAt <= now) store.delete(token);
  // Map keeps insertion order; refreshed entries are re-inserted, so the first ones are the stalest.
  while (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
}

/**
 * Stores `draft`. Reuses `token` when it belongs to the same user (the editor
 * updating an open preview), otherwise starts a new one.
 */
export function savePreview(draft: PreviewDraft, ownerId: string, token?: unknown): { token: string; rev: number } {
  prune();
  const existing = typeof token === "string" && TOKEN_PATTERN.test(token) ? store.get(token) : undefined;
  const reuse = existing && existing.ownerId === ownerId && existing.draft.kind === draft.kind;
  const id = reuse ? (token as string) : randomBytes(16).toString("hex");
  const rev = reuse ? existing.rev + 1 : 1;
  store.delete(id);
  store.set(id, { draft, rev, ownerId, expiresAt: Date.now() + TTL_MS });
  return { token: id, rev };
}

export function readPreview(token: string): { draft: PreviewDraft; rev: number } | null {
  if (!TOKEN_PATTERN.test(token)) return null;
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(token);
    return null;
  }
  return { draft: entry.draft, rev: entry.rev };
}
