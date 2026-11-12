"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_REFRESH_INTERVAL_MS,
  SESSION_WARNING_MS,
} from "@/app/lib/constants/session";

// Shared across tabs via localStorage, so activity in one tab keeps the others alive.
const ACTIVITY_KEY = "jmt-admin:lastActivity";
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel"] as const;

function readLastActivity(): number {
  try {
    const v = Number(localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(v) && v > 0 ? v : Date.now();
  } catch {
    return Date.now();
  }
}

function writeLastActivity(t: number) {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(t));
  } catch {
    /* storage blocked: this tab still tracks its own activity */
  }
}

/**
 * Signs the admin out after SESSION_IDLE_TIMEOUT_MS of inactivity, with a warning
 * dialog SESSION_WARNING_MS beforehand. While the user is active the server
 * session is extended via /api/auth/refresh (at most once per SESSION_REFRESH_INTERVAL_MS).
 */
export default function SessionTimeout() {
  const router = useRouter();
  const lastActivity = useRef(0);
  const lastRefresh = useRef(0);
  const endedRef = useRef(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const warningOpenRef = useRef(false);
  useEffect(() => {
    warningOpenRef.current = warningOpen;
  }, [warningOpen]);

  const endSession = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* cookie expires on its own shortly anyway */
    }
    router.replace("/login?reason=timeout");
  }, [router]);

  const refresh = useCallback(async () => {
    lastRefresh.current = Date.now();
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.status === 401) endSession(); // absolute cap reached or token invalid
    } catch {
      /* offline: try again on the next activity */
    }
  }, [endSession]);

  const markActive = useCallback(() => {
    if (endedRef.current) return;
    const now = Date.now();
    lastActivity.current = now;
    writeLastActivity(now);
    if (now - lastRefresh.current >= SESSION_REFRESH_INTERVAL_MS) refresh();
  }, [refresh]);

  useEffect(() => {
    lastActivity.current = Date.now();
    lastRefresh.current = Date.now(); // the page load itself came with a valid session
    writeLastActivity(lastActivity.current);

    // While the warning is shown, passive movement shouldn't silently dismiss it:
    // the user must click "Stay signed in".
    const onActivity = () => {
      if (!warningOpenRef.current) markActive();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY) lastActivity.current = Math.max(lastActivity.current, readLastActivity());
    };
    window.addEventListener("storage", onStorage);

    const tick = window.setInterval(() => {
      if (endedRef.current) return;
      const last = Math.max(lastActivity.current, readLastActivity());
      lastActivity.current = last;
      const remaining = last + SESSION_IDLE_TIMEOUT_MS - Date.now();
      if (remaining <= 0) {
        setWarningOpen(false);
        endSession();
      } else if (remaining <= SESSION_WARNING_MS) {
        setSecondsLeft(Math.ceil(remaining / 1000));
        setWarningOpen(true);
      } else {
        setWarningOpen(false); // e.g. another tab extended the session
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
      window.clearInterval(tick);
    };
  }, [markActive, endSession]);

  const staySignedIn = () => {
    lastRefresh.current = 0; // force a server refresh now
    markActive();
    setWarningOpen(false);
  };

  return (
    <Dialog open={warningOpen} onOpenChange={(open) => !open && staySignedIn()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. For security you&apos;ll be signed out in{" "}
            <span className="font-semibold text-foreground tabular-nums">{secondsLeft}s</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setWarningOpen(false); endSession(); }}>
            Log out
          </Button>
          <Button onClick={staySignedIn}>Stay signed in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
