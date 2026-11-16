"use client";

import { useEffect } from "react";

const DEFAULT_MESSAGE = "You have unsaved changes. Leave this page and lose them?";

/**
 * Warns before leaving a page with unsaved edits:
 *  - reload / close tab / typing a new URL → the browser's own "Leave site?" prompt
 *  - clicking an in-app link (sidebar, header, …) → a confirm dialog; Cancel stays put
 *
 * The App Router has no route-change event to cancel, so in-app links are
 * caught in the capture phase before Next's <Link> handles the click.
 */
export function useUnsavedChangesWarning(dirty: boolean, message = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // Modified clicks open a new tab/window — this page stays open.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // full navigation → beforeunload handles it
      const here = new URL(window.location.href);
      if (url.pathname === here.pathname && url.search === here.search) return; // same page / #hash

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, message]);
}
