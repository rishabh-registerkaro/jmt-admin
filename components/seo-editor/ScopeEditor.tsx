"use client";

// Editor for one SEO scope (app/dashboard/seo): the site-wide row or one page.
// Sections are shown by permission: schema needs seo.manage; GTM and custom
// scripts need seo.scripts. Inline errors use the same checks as the API
// (app/lib/content/seo.ts), so most mistakes show before saving.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Braces, Code2, ExternalLink, RotateCcw, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevalidateButton } from "@/components/common/RevalidateButton";
import { AddButton, Field, SectionCard, inputCls, itemCardCls, selectCls, textareaCls } from "@/components/homepage-editor/fields";
import { JMT_SEO_TAG } from "@/app/lib/utils/cacheTags";
import { liveSiteUrl } from "@/lib/frontendUrl";
import {
  GLOBAL_SCOPE,
  MAX_SCHEMAS,
  MAX_SCRIPTS,
  SCRIPT_TIMINGS,
  TIMING_LABELS,
  parseSchemaBlock,
  parseSnippet,
  validateGtmId,
  type JsonObject,
  type ScriptTiming,
} from "@/app/lib/content/seo";

/** Dashboard editor holding a page's meta title/description ("SEO" section). */
function pageEditorUrl(scope: string): string {
  if (scope === "/") return "/dashboard/homepage";
  // Service editors are opened by id, which a scope doesn't carry: go to the list.
  if (scope.startsWith("/service/")) return "/dashboard/services";
  // Site pages: the key is the path without its slash (app/lib/content/site-pages.ts).
  return `/dashboard/site-pages${scope}`;
}

export interface ScriptDraft {
  id?: string;
  name: string;
  enabled: boolean;
  timing: ScriptTiming;
  code: string;
}

/** One scope as GET /api/seo/entry returns it. */
export interface SeoEntry {
  scope: string;
  exists: boolean;
  updatedAt: string | null;
  gtmId: string | null;
  schemas: JsonObject[];
  scripts: ScriptDraft[];
  builtIn: string[];
}

interface Draft {
  gtmId: string;
  scripts: ScriptDraft[];
  schemas: string[];
}

interface ServerError {
  field: "schemas" | "scripts" | "gtmId";
  index: number;
  message: string;
}

const toDraft = (entry: SeoEntry): Draft => ({
  gtmId: entry.gtmId ?? "",
  scripts: entry.scripts.map((s) => ({ ...s })),
  schemas: entry.schemas.map((s) => JSON.stringify(s, null, 2)),
});

const SCHEMA_PLACEHOLDER = `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Joy Maa Tara",
  "telephone": "+91 …"
}`;

const SCRIPT_PLACEHOLDER = `<!-- Paste the vendor's snippet exactly as given, e.g. -->
<script async src="https://example.com/widget.js"></script>
<script>
  window.example = window.example || [];
</script>
<noscript><img src="https://example.com/pixel.gif" alt="" /></noscript>`;

const monoCls = `${textareaCls} font-mono text-xs leading-relaxed`;
const errorCls = "text-xs text-destructive";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function ScopeEditor({
  entry,
  label,
  canSchemas,
  canScripts,
  onSaved,
}: {
  entry: SeoEntry;
  /** Shown in toasts: "Site-wide", "About us", … */
  label: string;
  canSchemas: boolean;
  canScripts: boolean;
  onSaved: (entry: SeoEntry) => void;
}) {
  const isGlobal = entry.scope === GLOBAL_SCOPE;
  const [draft, setDraft] = useState<Draft>(() => toDraft(entry));
  const [saved, setSaved] = useState(() => JSON.stringify(toDraft(entry)));
  const [serverErrors, setServerErrors] = useState<ServerError[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState({ gtm: true, scripts: true, schemas: true });

  const dirty = JSON.stringify(draft) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Same checks as the API, live.
  const gtmError = useMemo(() => {
    const result = validateGtmId(draft.gtmId);
    return "error" in result ? result.error : null;
  }, [draft.gtmId]);
  const schemaErrors = useMemo(
    () =>
      draft.schemas.map((text) => {
        const result = parseSchemaBlock(text);
        return "error" in result ? result.error : null;
      }),
    [draft.schemas],
  );
  const scriptErrors = useMemo(
    () =>
      draft.scripts.map((script) => {
        if (!script.code.trim()) return "Paste the script code";
        const result = parseSnippet(script.code);
        if ("error" in result) return result.error;
        return result.nodes.length ? null : "Nothing to add: the code has no script, noscript, meta or link tag";
      }),
    [draft.scripts],
  );
  const serverError = (field: ServerError["field"], index: number) =>
    serverErrors.find((e) => e.field === field && e.index === index)?.message ?? null;

  const hasErrors =
    (canScripts && isGlobal && Boolean(gtmError)) ||
    (canSchemas && schemaErrors.some(Boolean)) ||
    (canScripts && scriptErrors.some(Boolean));

  const update = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setServerErrors([]);
  };
  const updateScript = (index: number, patch: Partial<ScriptDraft>) =>
    update({ scripts: draft.scripts.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  const updateSchema = (index: number, text: string) =>
    update({ schemas: draft.schemas.map((s, i) => (i === index ? text : s)) });

  const apply = (next: SeoEntry) => {
    const d = toDraft(next);
    setDraft(d);
    setSaved(JSON.stringify(d));
    setServerErrors([]);
    onSaved(next);
  };

  const url = `/api/seo/entry?scope=${encodeURIComponent(entry.scope)}`;

  const save = async () => {
    if (hasErrors) {
      toast.error("Fix the highlighted fields first", { closeButton: true });
      return;
    }
    setBusy(true);
    const toastId = toast.loading("Saving...");
    try {
      const body: Record<string, unknown> = {};
      if (canSchemas) body.schemas = draft.schemas.filter((s) => s.trim());
      if (canScripts) {
        body.scripts = draft.scripts;
        if (isGlobal) body.gtmId = draft.gtmId;
      }
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (Array.isArray(data.errors)) setServerErrors(data.errors);
        throw new Error(data.message || "Saving failed");
      }
      apply(data as SeoEntry);
      const note = data.revalidated === false ? " (cache refresh failed: it updates within 10 minutes)" : " — the website is updated";
      toast.success(`${label} SEO saved${note}`, { id: toastId, closeButton: true });
    } catch (error) {
      toast.error((error as Error).message || "Saving failed", { id: toastId, closeButton: true });
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm(`Remove all SEO settings and scripts of "${label}"?`)) return;
    setBusy(true);
    const toastId = toast.loading("Clearing...");
    try {
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Clearing failed");
      apply(data as SeoEntry);
      toast.success(`${label} SEO cleared`, { id: toastId, closeButton: true });
    } catch (error) {
      toast.error((error as Error).message || "Clearing failed", { id: toastId, closeButton: true });
    } finally {
      setBusy(false);
    }
  };

  // Keep the order of saved schema blocks; pretty-print on demand.
  const formatSchema = (index: number) => {
    const result = parseSchemaBlock(draft.schemas[index]);
    if ("value" in result && result.value.length) {
      updateSchema(index, JSON.stringify(result.value.length === 1 ? result.value[0] : result.value, null, 2));
    }
  };

  return (
    <div className="space-y-4">
      {/* Action bar — sticky so Save is always reachable */}
      <div className="sticky top-14 z-20 -mx-4 flex flex-col gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:top-0">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{label}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {dirty ? (
              <span className="text-warning">Unsaved changes</span>
            ) : entry.exists && entry.updatedAt ? (
              `Last saved ${new Date(entry.updatedAt).toLocaleString()}`
            ) : isGlobal ? (
              "Applies to every page"
            ) : (
              entry.scope
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:h-8 max-sm:[&>*]:px-3">
          {!isGlobal && (
            <Button asChild variant="outline">
              <a href={liveSiteUrl(entry.scope)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View live</span>
              </a>
            </Button>
          )}
          {dirty && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Discard your unsaved changes?")) {
                  setDraft(JSON.parse(saved));
                  setServerErrors([]);
                }
              }}
            >
              Discard
            </Button>
          )}
          <RevalidateButton label="SEO & Scripts" tags={[JMT_SEO_TAG]} />
          <Button onClick={save} disabled={busy || !dirty} className="px-6">
            {busy ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Where the other half of this page's SEO lives (SeoScriptsNote is the reverse note). */}
      <p className="text-xs text-muted-foreground">
        The browser tab title, Google description and share previews are not set here: edit them in{" "}
        {isGlobal ? (
          "each page's own SEO section"
        ) : (
          <>
            the{" "}
            <Link href={pageEditorUrl(entry.scope)} className="text-primary underline underline-offset-2">
              page&apos;s editor
            </Link>{" "}
            (SEO section)
          </>
        )}
        . Tags that would clash with them (description, robots, viewport, og:/twitter:, canonical) can&apos;t be
        added as custom scripts.
      </p>

      {/* ── Google Tag Manager ── */}
      {isGlobal && canScripts && (
        <SectionCard
          icon={Tag}
          title="Google Tag Manager"
          hint="Loads your GTM container on every page"
          open={open.gtm}
          onToggle={() => setOpen((o) => ({ ...o, gtm: !o.gtm }))}
        >
          <Field
            label="Container ID"
            hint="Add GA4, Google Ads, Meta Pixel, Clarity and other tags inside GTM: no code or deploy needed here. Leave empty to turn GTM off."
          >
            <input
              className={`${inputCls} max-w-xs font-mono uppercase`}
              value={draft.gtmId}
              placeholder="GTM-XXXXXXX"
              onChange={(e) => update({ gtmId: e.target.value })}
            />
          </Field>
          {(gtmError || serverError("gtmId", -1)) && <p className={errorCls}>{gtmError || serverError("gtmId", -1)}</p>}
        </SectionCard>
      )}

      {/* ── Custom scripts ── */}
      {canScripts && (
        <SectionCard
          icon={Code2}
          title={isGlobal ? "Custom scripts (every page)" : "Custom scripts (this page only)"}
          hint="For tools that can't be added through GTM"
          open={open.scripts}
          onToggle={() => setOpen((o) => ({ ...o, scripts: !o.scripts }))}
        >
          <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            These run on the live website for every visitor. Paste only code from a vendor you trust. Allowed tags:
            &lt;script&gt;, &lt;noscript&gt;, &lt;meta&gt; and &lt;link&gt; (https only).
            {!isGlobal && " Page scripts run once per visit; for per-page tracking events, use GTM triggers instead."}
          </div>
          {draft.scripts.length === 0 && <p className="text-sm text-muted-foreground">No custom scripts.</p>}
          {draft.scripts.map((script, index) => {
            const error = scriptErrors[index] || serverError("scripts", index);
            return (
              <div key={script.id ?? `new-${index}`} className={itemCardCls}>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={`${inputCls} min-w-40 flex-1`}
                    value={script.name}
                    placeholder="Name, e.g. Hotjar"
                    onChange={(e) => updateScript(index, { name: e.target.value })}
                    aria-label="Script name"
                  />
                  <select
                    className={`${selectCls} w-auto`}
                    value={script.timing}
                    onChange={(e) => updateScript(index, { timing: e.target.value as ScriptTiming })}
                    aria-label="When it loads"
                  >
                    {SCRIPT_TIMINGS.filter((t) => isGlobal || t !== "early").map((t) => (
                      <option key={t} value={t}>
                        {TIMING_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-foreground-light">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--color-brand,currentColor)]"
                      checked={script.enabled}
                      onChange={(e) => updateScript(index, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                  <div className="flex items-center">
                    <Button type="button" variant="ghost" size="sm" aria-label="Move up" disabled={index === 0} onClick={() => update({ scripts: move(draft.scripts, index, index - 1) })}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" aria-label="Move down" disabled={index === draft.scripts.length - 1} onClick={() => update({ scripts: move(draft.scripts, index, index + 1) })}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove script"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => update({ scripts: draft.scripts.filter((_, i) => i !== index) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <textarea
                  rows={8}
                  spellCheck={false}
                  className={monoCls}
                  value={script.code}
                  placeholder={SCRIPT_PLACEHOLDER}
                  onChange={(e) => updateScript(index, { code: e.target.value })}
                  aria-label="Script code"
                />
                {error && <p className={errorCls}>{error}</p>}
              </div>
            );
          })}
          <AddButton
            label="Add script"
            disabled={draft.scripts.length >= MAX_SCRIPTS}
            onClick={() => update({ scripts: [...draft.scripts, { name: "", enabled: true, timing: "default", code: "" }] })}
          />
        </SectionCard>
      )}

      {/* ── JSON-LD ── */}
      {canSchemas && (
        <SectionCard
          icon={Braces}
          title={isGlobal ? "Schema / JSON-LD (every page)" : "Schema / JSON-LD (this page only)"}
          hint="Structured data search engines read from the page HTML"
          open={open.schemas}
          onToggle={() => setOpen((o) => ({ ...o, schemas: !o.schemas }))}
        >
          <p className="text-xs text-muted-foreground">
            One JSON object per box (or a list of objects). &quot;@context&quot; is added when missing. Check the result
            with Google&apos;s{" "}
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-brand-link underline">
              Rich Results Test
            </a>
            .
          </p>
          {entry.builtIn.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Already output automatically{isGlobal ? " on every page" : " on this page"}:
              {entry.builtIn.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
              <span>— don&apos;t add these again.</span>
            </div>
          )}
          {draft.schemas.length === 0 && <p className="text-sm text-muted-foreground">No custom schema.</p>}
          {draft.schemas.map((text, index) => {
            const error = schemaErrors[index] || serverError("schemas", index);
            return (
              <div key={index} className={itemCardCls}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">Schema {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={Boolean(schemaErrors[index]) || !text.trim()} onClick={() => formatSchema(index)}>
                      Format
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove schema"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => update({ schemas: draft.schemas.filter((_, i) => i !== index) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <textarea
                  rows={10}
                  spellCheck={false}
                  className={monoCls}
                  value={text}
                  placeholder={SCHEMA_PLACEHOLDER}
                  onChange={(e) => updateSchema(index, e.target.value)}
                  aria-label={`Schema ${index + 1}`}
                />
                {error && <p className={errorCls}>{error}</p>}
              </div>
            );
          })}
          <AddButton label="Add schema" disabled={draft.schemas.length >= MAX_SCHEMAS} onClick={() => update({ schemas: [...draft.schemas, ""] })} />
        </SectionCard>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-10">
        {entry.exists ? (
          <Button variant="ghost" disabled={busy} className="text-muted-foreground hover:text-destructive" onClick={clear}>
            <RotateCcw className="mr-2 h-4 w-4" /> Clear all {isGlobal ? "site-wide" : "page"} settings
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={save} disabled={busy || !dirty} className="px-8">
          {busy ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
