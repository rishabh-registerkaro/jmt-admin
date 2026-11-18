"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const AUTOSAVE_DELAY_MS = 3000;

export type AutosaveStatus = "idle" | "saving" | "saved" | "failed" | "stopped";

interface Options {
  pageId: string;
  /** Latest edits, or null while there is nothing to autosave. */
  draft: { title: string; slug: string; content: unknown; baseUpdatedAt: string } | null;
}

/**
 * Stores unfinished service page edits on the server a few seconds after the
 * last change (app/api/jmt-services/[id]/autosave). Autosaves never touch the
 * live page. They stop for good once the account loses access.
 */
export function useServiceAutosave({ pageId, draft }: Options) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const stopped = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const body = draft ? JSON.stringify(draft) : null;

  useEffect(() => {
    if (!body || stopped.current) return;
    timer.current = setTimeout(() => {
      setStatus("saving");
      inFlight.current = (async () => {
        try {
          const res = await fetch(`/api/jmt-services/${pageId}/autosave`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body,
          });
          if (res.status === 401 || res.status === 403) {
            stopped.current = true;
            setStatus("stopped");
            toast.error("Your account no longer has access, so autosave has stopped.", { closeButton: true });
            return;
          }
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.message);
          setSavedAt(new Date(data.savedAt));
          setStatus("saved");
        } catch {
          setStatus("failed"); // The next edit tries again.
        } finally {
          inFlight.current = null;
        }
      })();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [body, pageId]);

  /** Cancels a pending autosave and waits for a running one, so it can't land after a real save. */
  const settle = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await inFlight.current;
  }, []);

  /** Removes the stored autosave. */
  const discard = useCallback(async () => {
    await settle();
    setStatus("idle");
    setSavedAt(null);
    await fetch(`/api/jmt-services/${pageId}/autosave`, { method: "DELETE", credentials: "include" }).catch(() => undefined);
  }, [pageId, settle]);

  return { status, savedAt, settle, discard };
}
