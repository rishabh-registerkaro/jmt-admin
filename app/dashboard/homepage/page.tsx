"use client";

// Homepage editor. Edits the single HomePageContent document that the public
// homepage at "/" renders (server/homepage.ts). Every section of the page maps
// to a card below; each card has a Visible/Hidden switch.

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  Eye,
  FileText,
  Hammer,
  HelpCircle,
  Image as ImageIcon,
  LayoutTemplate,
  ListChecks,
  Mail,
  Settings2,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HOME_META_DEFAULTS,
  defaultHomeContent,
  normalizeHomeContent,
  type HomePageContent,
  type HomeSectionKey,
  type TranslatedLanguage,
} from "@/app/lib/content/home-content";
import { SectionCard, TextField } from "@/components/homepage-editor/fields";
import type { SectionEditorProps } from "@/components/homepage-editor/types";
import HeroEditor from "@/components/homepage-editor/HeroEditor";
import ServicesEditor from "@/components/homepage-editor/ServicesEditor";
import SitesEditor from "@/components/homepage-editor/SitesEditor";
import WhyEditor from "@/components/homepage-editor/WhyEditor";
import TradesEditor from "@/components/homepage-editor/TradesEditor";
import ProcessEditor from "@/components/homepage-editor/ProcessEditor";
import FounderEditor from "@/components/homepage-editor/FounderEditor";
import BannerEditor from "@/components/homepage-editor/BannerEditor";
import FaqEditor from "@/components/homepage-editor/FaqEditor";
import ContactEditor from "@/components/homepage-editor/ContactEditor";
import SiteEditor from "@/components/homepage-editor/SiteEditor";
import TranslationEditor from "@/components/homepage-editor/TranslationEditor";
// Must match HOMEPAGE_CHANNEL in jmt-frontend/components/homepage/LiveRefresh.tsx.
// BroadcastChannel is same-origin only, so it reaches homepage tabs only when the
// frontend is served from the same origin as this admin; otherwise open tabs
// pick up the save on focus / every 30 s.
const HOMEPAGE_CHANNEL = "jmt-homepage";

/** Public URL of the jmt-frontend project (the Joy Maa Tara homepage). */
const FRONTEND_URL = (process.env.NEXT_PUBLIC_JMT_FRONTEND_URL || "http://localhost:3002").replace(/\/+$/, "");

type AnyEditor = ComponentType<SectionEditorProps<HomeSectionKey>>;

type EditLanguage = "en" | TranslatedLanguage;

/** Which language's text the form edits. The website serves them at /, /bn and /hi. */
const EDIT_LANGUAGES: { code: EditLanguage; label: string; path: string }[] = [
  { code: "en", label: "English", path: "" },
  { code: "bn", label: "বাংলা", path: "/bn" },
  { code: "hi", label: "हिन्दी", path: "/hi" },
];

/** One card per section; shown in the order chosen for the page (content.sectionOrder). */
const SECTIONS: { key: HomeSectionKey; title: string; hint: string; icon: React.ElementType; Editor: AnyEditor }[] = [
  { key: "hero", title: "Hero", hint: "Headline, buttons, trust points and background photo", icon: Sparkles, Editor: HeroEditor as AnyEditor },
  { key: "services", title: "Services", hint: "Heading and up to four service cards", icon: Wrench, Editor: ServicesEditor as AnyEditor },
  { key: "sites", title: "Sites we staff", hint: "Carousel of site types", icon: Building2, Editor: SitesEditor as AnyEditor },
  { key: "why", title: "Why choose us", hint: "Numbered reasons and photo", icon: BadgeCheck, Editor: WhyEditor as AnyEditor },
  { key: "trades", title: "Trades", hint: "Trade cards with icons and photos", icon: Hammer, Editor: TradesEditor as AnyEditor },
  { key: "process", title: "How we work", hint: "Step-by-step deployment process", icon: ListChecks, Editor: ProcessEditor as AnyEditor },
  { key: "founder", title: "Founder", hint: "Founder story, portrait and assurances", icon: UserRound, Editor: FounderEditor as AnyEditor },
  { key: "banner", title: "Banner", hint: "Wide photo banner with a button", icon: ImageIcon, Editor: BannerEditor as AnyEditor },
  { key: "faq", title: "FAQ", hint: "Questions for companies and workers, owner card", icon: HelpCircle, Editor: FaqEditor as AnyEditor },
  { key: "contact", title: "Contact", hint: "Contact card and lead form copy", icon: Mail, Editor: ContactEditor as AnyEditor },
];

interface EditorState {
  metaTitle: string;
  metaDescription: string;
  content: HomePageContent;
}

const snapshot = (state: EditorState) => JSON.stringify(state);

export default function HomepageDashboardPage() {
  const [state, setState] = useState<EditorState>(() => ({
    ...HOME_META_DEFAULTS,
    content: defaultHomeContent(),
  }));
  const [saved, setSaved] = useState<string>("");
  const [exists, setExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });
  const [editLang, setEditLang] = useState<EditLanguage>("en");
  // Opened in a new tab by Preview / View live (the page in the language being edited).
  const previewUrl = `${FRONTEND_URL}${EDIT_LANGUAGES.find((l) => l.code === editLang)?.path ?? ""}`;

  const dirty = !loading && snapshot(state) !== saved;

  const applyServerDoc = useCallback((doc: Record<string, unknown> | null | undefined) => {
    const next: EditorState = {
      metaTitle: typeof doc?.metaTitle === "string" ? doc.metaTitle : HOME_META_DEFAULTS.metaTitle,
      metaDescription:
        typeof doc?.metaDescription === "string" ? doc.metaDescription : HOME_META_DEFAULTS.metaDescription,
      content: normalizeHomeContent(doc?.content),
    };
    setState(next);
    setSaved(snapshot(next));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/homepage", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load the homepage");
        setExists(Boolean(data.exists));
        applyServerDoc(data.homePage);
      } catch (error) {
        const message = (error as Error).message || "Failed to load the homepage";
        setLoadError(message);
        toast.error(message, { closeButton: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [applyServerDoc]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setSection = <K extends keyof HomePageContent>(key: K, value: HomePageContent[K]) =>
    setState((prev) => ({ ...prev, content: { ...prev.content, [key]: value } }));

  const setEnabled = (key: HomeSectionKey, enabled: boolean) =>
    setState((prev) => ({
      ...prev,
      content: { ...prev.content, [key]: { ...prev.content[key], enabled } },
    }));

  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const allOpen = useMemo(() => SECTIONS.every((s) => open[s.key]), [open]);
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(["seo", "site", ...SECTIONS.map((s) => s.key)].map((k) => [k, value])));

  const handleSave = async () => {
    // Saving after a failed load would overwrite the real content with defaults.
    if (loadError) return;
    setSaving(true);
    const toastId = toast.loading("Saving...");
    try {
      const res = await fetch("/api/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(state),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      applyServerDoc(data.homePage);
      setExists(true);
      // Open homepage tabs (incl. ones opened via Preview) re-render with the new content.
      try {
        const channel = new BroadcastChannel(HOMEPAGE_CHANNEL);
        channel.postMessage({ type: "saved", at: Date.now() });
        channel.close();
      } catch {
        // BroadcastChannel unsupported — open tabs still pick it up on focus.
      }
      toast.success("Homepage saved — the website is updated", { id: toastId, closeButton: true });
    } catch (error) {
      toast.error((error as Error).message || "Failed to save", { id: toastId, closeButton: true });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Discard your unsaved changes?")) return;
    setState(JSON.parse(saved) as EditorState);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <p className="text-foreground-light">Loading...</p>
      </div>
    );
  }

  const { content } = state;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header — sticky so Save is always reachable on this long form */}
        <div className="sticky top-14 md:top-0 z-20 -mx-4 sm:-mx-6 mb-2 flex flex-col gap-3 border-b border-border bg-background/90 px-4 sm:px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <LayoutTemplate className="h-6 w-6 text-muted-foreground" /> Homepage
            </h1>
            <p className="text-sm text-muted-foreground">
              {dirty ? (
                <span className="text-warning">Unsaved changes</span>
              ) : (
                "Every section of the public homepage. Save to publish."
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setAll(!allOpen)}
              className="text-foreground-light hover:bg-muted/50 hover:text-foreground"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
            <Button asChild variant="outline">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" /> Preview
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> View live
              </a>
            </Button>
            {dirty && (
              <Button
                variant="outline"
                onClick={handleReset}
              >
                Discard
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || Boolean(loadError) || (!dirty && exists)}
              className="px-6"
            >
              {saving ? "Saving..." : exists ? "Save changes" : "Publish homepage"}
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong>Could not load the saved homepage, so saving is disabled.</strong> {loadError}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="shrink-0 border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Retry
            </Button>
          </div>
        )}

        {!exists && !loadError && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            The homepage has not been saved from the CMS yet, so it shows the built-in design content. The
            form below is pre-filled with that content — edit it and click <strong>Publish homepage</strong>.
          </div>
        )}

        <div role="tablist" aria-label="Language to edit" className="inline-flex rounded-lg border border-border bg-card p-1">
          {EDIT_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="tab"
              aria-selected={editLang === l.code}
              onClick={() => setEditLang(l.code)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                editLang === l.code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {editLang !== "en" ? (
          <TranslationEditor
            lang={editLang}
            content={content}
            metaTitle={state.metaTitle}
            metaDescription={state.metaDescription}
            onChange={(entries) => setSection("translations", { ...content.translations, [editLang]: entries })}
          />
        ) : (
          <>
        <h2 className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Page sections — same order as the website, top to bottom
        </h2>

        {content.sectionOrder.map((sectionKey) => {
          const section = SECTIONS.find((s) => s.key === sectionKey);
          if (!section) return null;
          const { key, title, hint, icon, Editor } = section;
          return (
            <SectionCard
              key={key}
              icon={icon}
              title={title}
              hint={hint}
              open={!!open[key]}
              onToggle={() => toggle(key)}
              enabled={content[key].enabled}
              onEnabledChange={(enabled) => setEnabled(key, enabled)}
            >
              <Editor value={content[key]} onChange={(value) => setSection(key, value)} />
            </SectionCard>
          );
        })}

        <h2 className="px-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Site-wide settings
        </h2>

        <SectionCard
          icon={Settings2}
          title="Navbar, footer & contact details"
          hint="Logos, phone, WhatsApp, email, button labels, language switcher, menu links and footer"
          open={!!open.site}
          onToggle={() => toggle("site")}
        >
          <SiteEditor value={content.site} onChange={(site) => setSection("site", site)} />
        </SectionCard>

        <SectionCard
          icon={FileText}
          title="SEO (hidden)"
          hint="Not shown on the page — browser tab title, Google results and link previews only"
          open={!!open.seo}
          onToggle={() => toggle("seo")}
        >
          <p className="text-xs text-warning/80">
            These texts do not appear on the website itself. To change the text under the main headline,
            edit <strong>Hero → Subtitle</strong>.
          </p>
          <TextField
            label="Meta title"
            value={state.metaTitle}
            hint={`${state.metaTitle.length} characters — about 50–60 is ideal`}
            onChange={(metaTitle) => setState((prev) => ({ ...prev, metaTitle }))}
          />
          <TextField
            label="Meta description"
            multiline
            value={state.metaDescription}
            hint={`${state.metaDescription.length} characters — about 150–160 is ideal`}
            onChange={(metaDescription) => setState((prev) => ({ ...prev, metaDescription }))}
          />
        </SectionCard>
          </>
        )}

        <div className="flex justify-end pb-10">
          <Button
            onClick={handleSave}
            disabled={saving || Boolean(loadError) || (!dirty && exists)}
            className="px-8"
          >
            {saving ? "Saving..." : exists ? "Save changes" : "Publish homepage"}
          </Button>
        </div>
      </div>
    </div>
  );
}
