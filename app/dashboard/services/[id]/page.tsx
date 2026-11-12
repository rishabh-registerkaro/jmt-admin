"use client";

// Editor for one JMT service page. Every section of the public page maps to a
// card below (same order as the website); each content section can be hidden.
// Saving stores the page and refreshes it on jmt-frontend at once (ISR tag).

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  ListChecks,
  Mail,
  Menu,
  Settings2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Grid, SectionCard, SelectField, TextField } from "@/components/homepage-editor/fields";
import {
  CrewPart,
  FaqPart,
  HeroPart,
  IncludedPart,
  PlansPart,
  RelatedPart,
  RolesPart,
  StepsPart,
  SubnavPart,
  UseCasesPart,
  type PartProps,
} from "@/components/jmt-service-editor/sections";
import type { ServicePageContent, ServiceSectionKey } from "@/types/service";
import { FRONTEND_URL, useDraftPreview } from "@/hooks/useDraftPreview";

type Status = "draft" | "published";
interface EditorState {
  title: string;
  slug: string;
  status: Status;
  content: ServicePageContent;
}

type Part = keyof Pick<
  ServicePageContent,
  "hero" | "subnav" | "useCases" | "included" | "roles" | "crew" | "plans" | "steps" | "faq" | "related"
>;
type AnyPart = ComponentType<PartProps<Part>>;

/** Cards in page order. `visibility` = the switch that hides the section. */
const SECTIONS: { key: Part; title: string; hint: string; icon: React.ElementType; Editor: AnyPart; visibility?: ServiceSectionKey }[] = [
  { key: "hero", title: "Hero", hint: "Breadcrumb, headline, buttons, photo and quick facts", icon: Sparkles, Editor: HeroPart as AnyPart },
  { key: "subnav", title: "Section menu", hint: "Sticky links under the hero", icon: Menu, Editor: SubnavPart as AnyPart },
  { key: "useCases", title: "When you’d use this", hint: "Use-case cards", icon: Layers, Editor: UseCasesPart as AnyPart, visibility: "useCases" },
  { key: "included", title: "What’s included", hint: "What JMT provides and what the client provides", icon: ListChecks, Editor: IncludedPart as AnyPart, visibility: "included" },
  { key: "roles", title: "Roles", hint: "Trades and roles the visitor can tick", icon: Users, Editor: RolesPart as AnyPart, visibility: "roles" },
  { key: "crew", title: "Your crew", hint: "Worker checks and sample crew list", icon: BadgeCheck, Editor: CrewPart as AnyPart, visibility: "crew" },
  { key: "plans", title: "Plans", hint: "Ways to engage", icon: Wallet, Editor: PlansPart as AnyPart, visibility: "plans" },
  { key: "steps", title: "How it works", hint: "Steps after an enquiry", icon: ClipboardList, Editor: StepsPart as AnyPart, visibility: "steps" },
  { key: "faq", title: "FAQ", hint: "Questions and contact card", icon: HelpCircle, Editor: FaqPart as AnyPart, visibility: "faq" },
  { key: "related", title: "Related services", hint: "Cards linking to other services", icon: Layers, Editor: RelatedPart as AnyPart, visibility: "related" },
];

const snapshot = (s: EditorState) => JSON.stringify(s);

/** Section visibility switches were removed, so every section is saved (and previewed) as shown. */
const allVisible = (content: ServicePageContent): ServicePageContent => ({
  ...content,
  visible: Object.fromEntries(Object.keys(content.visible).map((k) => [k, true])) as ServicePageContent["visible"],
});

export default function JmtServiceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<EditorState | null>(null);
  const [saved, setSaved] = useState("");
  const [liveSlug, setLiveSlug] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ settings: true });

  const dirty = state !== null && snapshot(state) !== saved;

  const apply = useCallback((page: EditorState) => {
    const next: EditorState = { title: page.title, slug: page.slug, status: page.status, content: page.content };
    setState(next);
    setSaved(snapshot(next));
    setLiveSlug(page.slug);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/jmt-services/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load the page");
        apply(data.page);
      } catch (error) {
        const message = (error as Error).message;
        setLoadError(message);
        toast.error(message, { closeButton: true });
      }
    })();
  }, [id, apply]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const allOpen = useMemo(() => SECTIONS.every((s) => open[s.key]), [open]);

  // Preview: the page with these unsaved edits, in a new tab — works for drafts too (hooks/useDraftPreview.ts).
  const previewPayload = useMemo(
    () => (state ? { kind: "service" as const, slug: state.slug, content: allVisible(state.content) } : null),
    [state],
  );
  const { openPreview, opening: previewOpening } = useDraftPreview({
    payload: previewPayload,
    path: `/service/${state?.slug || liveSlug}`,
    windowName: `jmt-preview-service-${id}`,
  });

  if (loadError) {
    return (
      <div className="p-6 text-sm text-destructive">
        Could not load this page: {loadError}{" "}
        <Link href="/dashboard/services" className="underline">
          Back to the list
        </Link>
      </div>
    );
  }
  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-foreground-light">Loading...</p>
      </div>
    );
  }

  const { content } = state;
  const setContent = <K extends keyof ServicePageContent>(key: K, value: ServicePageContent[K]) =>
    setState((prev) => prev && { ...prev, content: { ...prev.content, [key]: value } });
  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(["settings", "contact", ...SECTIONS.map((s) => s.key)].map((k) => [k, value])));

  const save = async (override?: Partial<EditorState>) => {
    const body = { ...state, ...override };
    setSaving(true);
    const toastId = toast.loading("Saving...");
    try {
      const res = await fetch(`/api/jmt-services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...body, content: allVisible(body.content) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      apply(data.page);
      toast.success(
        data.page.status === "published" ? "Saved — the live page is updated" : "Saved as draft (not on the website)",
        { id: toastId, closeButton: true },
      );
    } catch (error) {
      toast.error((error as Error).message || "Failed to save", { id: toastId, closeButton: true });
    } finally {
      setSaving(false);
    }
  };

  const published = state.status === "published";
  const liveUrl = `${FRONTEND_URL}/service/${liveSlug}`;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="sticky top-14 md:top-0 z-20 -mx-4 sm:-mx-6 mb-2 flex flex-col gap-2 sm:gap-3 border-b border-border bg-background/90 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link href="/dashboard/services" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Services
            </Link>
            <h1 className="truncate text-xl sm:text-2xl font-bold text-foreground">{state.title || "Untitled page"}</h1>
            <p className="truncate text-xs sm:text-sm text-muted-foreground">
              {dirty ? (
                <span className="text-warning">Unsaved changes</span>
              ) : published ? (
                `Published at /service/${liveSlug}`
              ) : (
                "Draft — not on the website"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:h-8 max-sm:[&>*]:px-3">
            <Button variant="ghost" onClick={() => setAll(!allOpen)} className="text-foreground-light hover:bg-muted/50 hover:text-foreground">
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
            {/* The page with the unsaved edits — nothing is published until Save */}
            <Button
              variant="outline"
              onClick={openPreview}
              disabled={previewOpening}
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
                onClick={() => window.confirm("Discard your unsaved changes?") && setState(JSON.parse(saved))}
              >
                Discard
              </Button>
            )}
            {!published && (
              <Button variant="outline" disabled={saving} onClick={() => save({ status: "published" })}>
                Publish
              </Button>
            )}
            <Button onClick={() => save()} disabled={saving || !dirty} className="ml-auto px-6 sm:ml-0">
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        <SectionCard icon={Settings2} title="Page settings & SEO" hint="Name, URL, status, browser title and Google description" open={!!open.settings} onToggle={() => toggle("settings")}>
          <Grid cols={3}>
            <TextField label="Page name (dashboard only)" value={state.title} onChange={(title) => setState({ ...state, title })} />
            <TextField
              label="URL slug"
              hint={`/service/${state.slug} — changing it moves the page; old links stop working`}
              value={state.slug}
              onChange={(slug) => setState({ ...state, slug: slug.toLowerCase() })}
            />
            <SelectField<Status>
              label="Status"
              value={state.status}
              options={["draft", "published"]}
              onChange={(status) => setState({ ...state, status })}
            />
          </Grid>
          <p className="text-xs text-warning/80">
            Meta title and description do not appear on the page itself — only in the browser tab, Google results and
            link previews. To change the text under the headline, edit <strong>Hero → Subtitle</strong>.
          </p>
          <TextField
            label="Meta title"
            hint={`${content.meta.title.length} characters — about 50–60 is ideal`}
            value={content.meta.title}
            onChange={(title) => setContent("meta", { ...content.meta, title })}
          />
          <TextField
            label="Meta description"
            multiline
            hint={`${content.meta.description.length} characters — about 150–160 is ideal`}
            value={content.meta.description}
            onChange={(description) => setContent("meta", { ...content.meta, description })}
          />
        </SectionCard>

        <h2 className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Page sections — same order as the website, top to bottom
        </h2>

        {SECTIONS.map(({ key, title, hint, icon, Editor }) => (
          <SectionCard
            key={key}
            icon={icon}
            title={title}
            hint={hint}
            open={!!open[key]}
            onToggle={() => toggle(key)}
          >
            <Editor value={content[key]} onChange={(value) => setContent(key, value)} />
          </SectionCard>
        ))}

        <SectionCard
          icon={Mail}
          title="Contact form"
          hint="Shared contact block — its photo, form and details are edited on the Homepage"
          open={!!open.contact}
          onToggle={() => toggle("contact")}
        >
          <TextField label="Heading on this page" value={content.contactTitle} onChange={(contactTitle) => setContent("contactTitle", contactTitle)} />
          <p className="text-xs text-muted-foreground">
            <FileText className="mr-1 inline h-3 w-3" />
            Always shown: every “Request” button on the page scrolls to this form.
          </p>
        </SectionCard>

        <div className="flex justify-end pb-10">
          <Button onClick={() => save()} disabled={saving || !dirty} className="px-8">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
