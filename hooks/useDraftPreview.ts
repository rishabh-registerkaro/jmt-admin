"use client";

// "Preview" for the page editors (homepage, service pages, site pages): shows
// the real website page with the editor's UNSAVED changes in a new tab.
//
//   1. The draft is sent to POST /api/preview (kept in jmt-admin's memory —
//      nothing is saved, the live site is unchanged).
//   2. A tab opens jmt-frontend's /api/preview?token=…&path=…, which turns on
//      Draft Mode for this browser only and shows the page with the draft.
//   3. While that preview is open, further edits are re-sent (debounced) and
//      the preview tab re-renders by itself within a couple of seconds.
//
// Only "Save changes" publishes to the live website.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Public URL of the jmt-frontend project (the Joy Maa Tara website). */
export { FRONTEND_URL } from "@/lib/frontendUrl";
import { FRONTEND_URL } from "@/lib/frontendUrl";

const SYNC_DELAY_MS = 600;

export type PreviewPayload =
  | { kind: "homepage"; metaTitle: string; metaDescription: string; content: unknown }
  | { kind: "service"; slug: string; content: unknown }
  | { kind: "site-page"; key: string; content: unknown };

interface Options {
  /** The draft as it would be saved; null while the editor is still loading. */
  payload: PreviewPayload | null;
  /** Website path to show, e.g. "/", "/service/site-service-supply". */
  path: string;
  /** Browser tab name, so repeated clicks reuse one preview tab per editor. */
  windowName: string;
}

export function useDraftPreview({ payload, path, windowName }: Options) {
  const [opening, setOpening] = useState(false);
  const [active, setActive] = useState(false);
  const token = useRef<string | null>(null);
  const json = payload ? JSON.stringify(payload) : null;
  const lastSent = useRef<string | null>(null);

  const send = useCallback(async (body: string): Promise<string> => {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...JSON.parse(body), token: token.current }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not prepare the preview");
    token.current = data.token;
    lastSent.current = body;
    return data.token as string;
  }, []);

  const openPreview = useCallback(async () => {
    if (!json) return;
    // Open the tab inside the click so pop-up blockers allow it; point it at the page once the draft is stored.
    const tab = window.open("", windowName);
    setOpening(true);
    try {
      const id = await send(json);
      const url = `${FRONTEND_URL}/api/preview?token=${id}&path=${encodeURIComponent(path)}`;
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
        tab.focus();
      } else {
        toast.message("Your browser blocked the preview tab", {
          action: { label: "Open preview", onClick: () => window.open(url, windowName) },
          closeButton: true,
        });
      }
      setActive(true);
    } catch (error) {
      tab?.close();
      toast.error((error as Error).message, { closeButton: true });
    } finally {
      setOpening(false);
    }
  }, [json, path, send, windowName]);

  // Keep an open preview in step with the form.
  useEffect(() => {
    if (!active || !json || json === lastSent.current) return;
    const timer = window.setTimeout(() => {
      send(json).catch(() => {
        // Not fatal: the next edit or a Preview click tries again.
      });
    }, SYNC_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, json, send]);

  return { openPreview, opening, previewing: active };
}
