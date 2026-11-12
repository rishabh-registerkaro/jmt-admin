"use client";

// Editor for one Joy Maa Tara site page (About, Contact, Join our crew).
// The form is generated from the page's bundled copy (app/lib/content/site-pages.ts);
// saving stores it in `jmt_site_pages` and refreshes the page on jmt-frontend at once.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentEditor from "@/components/site-page-editor/ContentEditor";
import { SITE_PAGES, isSitePageKey } from "@/app/lib/content/site-pages";
import type { PlainObject } from "@/lib/sitePages/mergeContent";
import { FRONTEND_URL, useDraftPreview } from "@/hooks/useDraftPreview";

interface ServerDoc {
  success?: boolean;
  message?: string;
  exists?: boolean;
  updatedAt?: string | null;
  content?: PlainObject;
}

export default function SitePageEditor() {
  const params = useParams<{ key: string }>();
  const key = params.key;
  const page = isSitePageKey(key) ? SITE_PAGES[key] : null;

  const [content, setContent] = useState<PlainObject | null>(null);
  const [saved, setSaved] = useState("");
  const [exists, setExists] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });

  const dirty = content !== null && JSON.stringify(content) !== saved;

  // Preview: the page with these unsaved edits, in a new tab (hooks/useDraftPreview.ts).
  const previewPayload = useMemo(
    () => (page && content && !loadError ? { kind: "site-page" as const, key, content } : null),
    [page, content, loadError, key],
  );
  const { openPreview, opening: previewOpening } = useDraftPreview({
    payload: previewPayload,
    path: page?.path ?? "/",
    windowName: `jmt-preview-page-${key}`,
  });

  const apply = useCallback((doc: ServerDoc) => {
    const next = doc.content ?? {};
    setContent(next);
    setSaved(JSON.stringify(next));
    setExists(Boolean(doc.exists));
    setUpdatedAt(doc.updatedAt ?? null);
  }, []);

  useEffect(() => {
    if (!page) return;
    (async () => {
      try {
        const res = await fetch(`/api/site-pages/${key}`, { credentials: "include" });
        const data: ServerDoc = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load the page");
        apply(data);
      } catch (error) {
        const message = (error as Error).message || "Failed to load the page";
        setLoadError(message);
        toast.error(message, { closeButton: true });
      }
    })();
  }, [key, page, apply]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const send = async (method: "PUT" | "DELETE", pending: string, done: string) => {
    // Saving after a failed load would overwrite the real content with defaults.
    if (loadError) return;
    setBusy(true);
    const toastId = toast.loading(pending);
    try {
      const res = await fetch(`/api/site-pages/${key}`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: method === "PUT" ? JSON.stringify({ content }) : undefined,
      });
      const data: ServerDoc = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
      apply(data);
      toast.success(done, { id: toastId, closeButton: true });
    } catch (error) {
      toast.error((error as Error).message || "Request failed", { id: toastId, closeButton: true });
    } finally {
      setBusy(false);
    }
  };

  if (!page) {
    return (
      <div className="space-y-2 p-6">
        <p className="text-foreground">Unknown page.</p>
        <Link href="/dashboard" className="text-sm text-brand-link underline">
          Back to the dashboard
        </Link>
      </div>
    );
  }

  const liveUrl = `${FRONTEND_URL}${page.path}`;
  const save = () => send("PUT", "Saving...", `${page.title} saved — the website is updated`);
  const saveDisabled = busy || Boolean(loadError) || content === null || (!dirty && exists);
  const saveLabel = busy ? "Saving..." : exists ? "Save changes" : "Publish page";
  const sectionKeys = Object.keys(page.defaults);
  const allOpen = sectionKeys.every((k) => open[k]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header — sticky so Save is always reachable on this long form */}
        <div className="sticky top-14 z-20 -mx-4 mb-2 flex flex-col gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4 md:top-0">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">{page.title}</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {dirty ? (
                <span className="text-warning">Unsaved changes</span>
              ) : exists && updatedAt ? (
                `Last saved ${new Date(updatedAt).toLocaleString()}`
              ) : (
                page.path
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:h-8 max-sm:[&>*]:px-3">
            <Button
              variant="ghost"
              onClick={() => setOpen(Object.fromEntries(sectionKeys.map((k) => [k, !allOpen])))}
              className="text-foreground-light hover:bg-muted/50 hover:text-foreground"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
            {/* The page with the unsaved edits — nothing is published until Save */}
            <Button
              variant="outline"
              onClick={openPreview}
              disabled={previewOpening || content === null || Boolean(loadError)}
              aria-label="Preview unsaved changes"
              title="Open this page with your unsaved changes (not published)"
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{previewOpening ? "Opening..." : "Preview"}</span>
            </Button>
            <Button asChild variant="outline">
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" aria-label="View live">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View live</span>
              </a>
            </Button>
            {dirty && (
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm("Discard your unsaved changes?")) setContent(JSON.parse(saved));
                }}
              >
                Discard
              </Button>
            )}
            <Button onClick={save} disabled={saveDisabled} className="ml-auto px-6 sm:ml-0">
              {saveLabel}
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong>Could not load the page, so saving is disabled.</strong> {loadError}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()} className="shrink-0">
              Retry
            </Button>
          </div>
        )}

        {content === null && !loadError && <p className="text-foreground-light">Loading...</p>}

        {content && (
          <>
            <h2 className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Page sections — same order as the website, top to bottom
            </h2>
            <ContentEditor
              page={page}
              content={content}
              onChange={(update) => setContent((prev) => (prev ? update(prev) : prev))}
              open={open}
              onToggle={(k) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
            />
            <div className="flex items-center justify-between gap-3 pb-10">
              {exists ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const question = `Reset the whole "${page.title}" page to the built-in copy? Your saved edits will be deleted.`;
                    if (window.confirm(question)) send("DELETE", "Resetting...", `${page.title} reset to the default copy`);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset page to default
                </Button>
              ) : (
                <span />
              )}
              <Button onClick={save} disabled={saveDisabled} className="px-8">
                {saveLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
