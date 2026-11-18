"use client";

// Dashboard → Menus → Header Menu / Footer Menu: the navbar ("header") and the
// footer ("footer") of the Joy Maa Tara website (jmt-frontend). Both live in
// the homepage document's `site` block; saving sends `part`, so
// POST /api/homepage changes only that part. Layout and Preview work like the
// Homepage editor. The main website's menus are still edited at
// /dashboard/header-menu and /dashboard/footer-menu (no longer linked).

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { Columns3, Copyright, ExternalLink, Eye, Image as ImageIcon, ListStart, PanelBottom, PanelTop, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageField from "@/components/common/ImageField";
import { RevalidateButton } from "@/components/common/RevalidateButton";
import { SectionCard, TextField } from "@/components/homepage-editor/fields";
import {
  FooterColumnsEditor,
  LinkOptionsList,
  NavItemsEditor,
  type LinkOption,
} from "@/components/homepage-editor/MenuTree";
import { HOME_META_DEFAULTS, isSafeHref, normalizeHomeContent, type HomePageContent } from "@/app/lib/content/home-content";
import { BRAND_LOGOS } from "@/data/homepageFallback";
import { liveSiteUrl, useDraftPreview } from "@/hooks/useDraftPreview";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

// Must match HOMEPAGE_CHANNEL in jmt-frontend/components/homepage/LiveRefresh.tsx.
const HOMEPAGE_CHANNEL = "jmt-homepage";

type Part = "header" | "footer";
type Site = HomePageContent["site"];

const PARTS: Record<Part, { title: string; icon: ElementType; description: string; sections: { key: string; title: string; hint: string; icon: ElementType }[] }> = {
  header: {
    title: "Header Menu",
    icon: PanelTop,
    description: "The navbar at the top of every page of the website. Save to publish.",
    sections: [
      { key: "brand", title: "Brand", hint: "Navbar logo and business name", icon: ImageIcon },
      { key: "menu", title: "Menu items", hint: "Links and dropdowns, in navbar order", icon: ListStart },
    ],
  },
  footer: {
    title: "Footer Menu",
    icon: PanelBottom,
    description: "The footer at the bottom of every page of the website. Save to publish.",
    sections: [
      { key: "brand", title: "Brand", hint: "Footer logo and description", icon: ImageIcon },
      { key: "columns", title: "Link columns", hint: "Columns of links, in footer order", icon: Columns3 },
      { key: "contact", title: "Contact column", hint: "Title and WhatsApp text of the last column", icon: Phone },
      { key: "copyright", title: "Copyright line", hint: "Optional line at the very bottom", icon: Copyright },
    ],
  },
};

/** Pages of jmt-frontend (app/) and homepage sections, offered as link suggestions. */
const FIXED_LINKS: LinkOption[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/join-our-crew", label: "Join our crew" },
  { href: "#services", label: "Homepage: Services" },
  { href: "#sites", label: "Homepage: Sites we staff" },
  { href: "#why-us", label: "Homepage: Why choose us" },
  { href: "#trades", label: "Homepage: Trades" },
  { href: "#how-we-work", label: "Homepage: How we work" },
  { href: "#about", label: "Homepage: Founder" },
  { href: "#faq", label: "Homepage: FAQ" },
  // "/#contact", not "#contact": the website keeps "#contact" in-page, and only some pages have that form.
  { href: "/#contact", label: "Homepage: Contact form" },
];

interface EditorState {
  metaTitle: string;
  metaDescription: string;
  content: HomePageContent;
}

const snapshot = (state: EditorState) => JSON.stringify(state);

const toEditorState = (doc: Record<string, unknown> | null | undefined): EditorState => ({
  metaTitle: typeof doc?.metaTitle === "string" ? doc.metaTitle : HOME_META_DEFAULTS.metaTitle,
  metaDescription: typeof doc?.metaDescription === "string" ? doc.metaDescription : HOME_META_DEFAULTS.metaDescription,
  content: normalizeHomeContent(doc?.content),
});

/** Link suggestions plus the live service pages; null when they can't be loaded (no suggestions or 404 warnings then). */
function useLinkOptions(): LinkOption[] | null {
  const [options, setOptions] = useState<LinkOption[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/jmt-services", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) return;
        // Live on the website: published pages, and built-in pages not yet in the CMS.
        const live: { slug: string; title: string }[] = [
          ...(data.pages ?? []).filter((p: { status: string }) => p.status === "published"),
          ...(data.builtIn ?? []),
        ];
        if (!cancelled) setOptions([...FIXED_LINKS, ...live.map((p) => ({ href: `/service/${p.slug}`, label: p.title }))]);
      } catch {
        // No suggestions — the editor still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return options;
}

export default function SiteMenuPage() {
  const params = useParams<{ part: string }>();
  const part = params.part === "header" || params.part === "footer" ? params.part : null;
  if (!part) notFound();
  return <SiteMenuEditor key={part} part={part} />;
}

function SiteMenuEditor({ part }: { part: Part }) {
  const config = PARTS[part];
  const [state, setState] = useState<EditorState>(() => toEditorState(null));
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ [config.sections[1].key]: true });
  const options = useLinkOptions();

  // After a failed load nothing was loaded, so nothing can be unsaved.
  const dirty = !loading && !loadError && saved !== "" && snapshot(state) !== saved;
  useUnsavedChangesWarning(dirty);

  // Preview: the website with these unsaved edits, in a new tab (hooks/useDraftPreview.ts).
  const previewPayload = useMemo(
    () => (loading || loadError ? null : { kind: "homepage" as const, ...state }),
    [loading, loadError, state],
  );
  const { openPreview, opening: previewOpening } = useDraftPreview({
    payload: previewPayload,
    path: "/",
    windowName: `jmt-preview-${part}`,
  });

  const applyServerDoc = useCallback((doc: Record<string, unknown> | null | undefined) => {
    const next = toEditorState(doc);
    setState(next);
    setSaved(snapshot(next));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/homepage", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load the menu");
        applyServerDoc(data.homePage);
      } catch (error) {
        const message = (error as Error).message || "Failed to load the menu";
        setLoadError(message);
        toast.error(message, { closeButton: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [applyServerDoc]);

  const site = state.content.site;
  const setSite = (next: Site) => setState((prev) => ({ ...prev, content: { ...prev.content, site: next } }));
  const patchSite = (patch: Partial<Site>) => setSite({ ...site, ...patch });
  const patchBrand = (patch: Partial<Site["brand"]>) => patchSite({ brand: { ...site.brand, ...patch } });
  const patchLabels = (patch: Partial<Site["labels"]>) => patchSite({ labels: { ...site.labels, ...patch } });

  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const allOpen = config.sections.every((s) => open[s.key]);
  const setAll = (value: boolean) => setOpen(Object.fromEntries(config.sections.map((s) => [s.key, value])));

  const handleSave = async () => {
    // Saving after a failed load would overwrite the real content with defaults.
    if (loadError) return;
    // The server blanks links it does not accept (e.g. "www.x.com"); say so instead of losing them.
    const links =
      part === "header"
        ? site.nav.flatMap((item) => [item, ...item.children])
        : site.footerColumns.flatMap((column) => column.links);
    const bad = links.find((l) => l.href.trim() && !isSafeHref(l.href.trim()));
    if (bad) {
      toast.error(`"${bad.label || bad.href}" has a link the website can't use: ${bad.href}`, {
        description: "Start it with / (a page here), # (a homepage section), https://, mailto: or tel:.",
        closeButton: true,
      });
      return;
    }
    setSaving(true);
    const toastId = toast.loading("Saving...");
    const sent = snapshot(state);
    try {
      const res = await fetch("/api/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...state, part }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      // Keep anything typed while the save was in flight; it stays "unsaved".
      const next = toEditorState(data.homePage);
      setState((prev) => (snapshot(prev) === sent ? next : prev));
      setSaved(snapshot(next));
      // Open homepage tabs (incl. ones opened via Preview) re-render with the new content.
      try {
        const channel = new BroadcastChannel(HOMEPAGE_CHANNEL);
        channel.postMessage({ type: "saved", at: Date.now() });
        channel.close();
      } catch {
        // BroadcastChannel unsupported — open tabs still pick it up on focus.
      }
      toast.success(`${config.title} saved — the website is updated`, { id: toastId, closeButton: true });
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

  const sectionBody = (key: string) => {
    switch (`${part}:${key}`) {
      case "header:brand":
        return (
          <>
            <ImageField
              label="Navbar logo"
              value={site.brand.headerLogo}
              defaultSrc={BRAND_LOGOS.header.src}
              hint="SVG or PNG with a transparent background, about 3:1. Leave empty for the built-in logo."
              onChange={(headerLogo) => patchBrand({ headerLogo })}
            />
            <TextField
              label="Business name"
              value={site.brand.name}
              hint="Read out by screen readers on the navbar and footer logo links."
              onChange={(name) => patchBrand({ name })}
            />
          </>
        );
      case "header:menu":
        return (
          <>
            <p className="text-xs text-muted-foreground">
              The orange &quot;Contact&quot; button is fixed and opens /contact, so a menu item that also opens /contact is not
              shown. Items without a label are hidden.
            </p>
            <NavItemsEditor value={site} onChange={setSite} options={options ?? undefined} />
          </>
        );
      case "footer:brand":
        return (
          <>
            <ImageField
              label="Footer logo"
              value={site.brand.footerLogo}
              defaultSrc={BRAND_LOGOS.footer.src}
              hint="SVG or PNG with a transparent background, about 3:1. Leave empty for the built-in logo."
              onChange={(footerLogo) => patchBrand({ footerLogo })}
            />
            <TextField
              label="Footer description"
              multiline
              rows={2}
              value={site.footerDescription}
              onChange={(footerDescription) => patchSite({ footerDescription })}
            />
          </>
        );
      case "footer:columns":
        return <FooterColumnsEditor value={site} onChange={setSite} options={options ?? undefined} />;
      case "footer:contact":
        return (
          <>
            <TextField
              label="Column title"
              value={site.labels.footerContactTitle}
              onChange={(footerContactTitle) => patchLabels({ footerContactTitle })}
            />
            <TextField
              label="WhatsApp link text"
              value={site.labels.whatsappDisplay}
              hint="Leave empty to show the WhatsApp number instead."
              onChange={(whatsappDisplay) => patchLabels({ whatsappDisplay })}
            />
            <p className="text-xs text-muted-foreground">
              The phone, WhatsApp number, email and hours in this column are edited on{" "}
              <Link href="/dashboard/homepage" className="font-medium text-brand-link underline-offset-4 hover:underline">
                Homepage → Contact details
              </Link>
              .
            </p>
          </>
        );
      case "footer:copyright":
        return (
          <TextField
            label="Copyright line (optional)"
            placeholder="© 2026 Joy Maa Tara Bama Kripa"
            value={site.copyright}
            onChange={(copyright) => patchSite({ copyright })}
          />
        );
      default:
        return null;
    }
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header — sticky so Save is always reachable */}
        <div className="sticky top-14 md:top-0 z-20 -mx-4 sm:-mx-6 mb-2 flex flex-col gap-2 sm:gap-3 border-b border-border bg-background/90 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" /> {config.title}
            </h1>
            <p className="truncate text-xs sm:text-sm text-muted-foreground">
              {dirty ? <span className="text-warning">Unsaved changes</span> : config.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:h-8 max-sm:[&>*]:px-3">
            <Button
              variant="ghost"
              onClick={() => setAll(!allOpen)}
              className="text-foreground-light hover:bg-muted/50 hover:text-foreground"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
            {/* The website with the unsaved edits — nothing is published until Save */}
            <Button
              variant="outline"
              onClick={openPreview}
              disabled={previewOpening || Boolean(loadError)}
              aria-label="Preview unsaved changes"
              title="Open the website with your unsaved changes (not published)"
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{previewOpening ? "Opening..." : "Preview"}</span>
            </Button>
            <Button asChild variant="outline">
              <a href={liveSiteUrl()} target="_blank" rel="noopener noreferrer" aria-label="View live">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View live</span>
              </a>
            </Button>
            {dirty && (
              <Button variant="outline" onClick={handleReset}>
                Discard
              </Button>
            )}
            <RevalidateButton
              label={config.title}
              tags={part === "header" ? ["homepage", "jmt-service-list"] : ["homepage"]}
            />
            <Button
              onClick={handleSave}
              disabled={saving || Boolean(loadError) || !dirty}
              className="ml-auto px-6 sm:ml-0"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong>Could not load the saved menu, so saving is disabled.</strong> {loadError}
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

        {config.sections.map(({ key, title, hint, icon }) => (
          <SectionCard key={key} icon={icon} title={title} hint={hint} open={!!open[key]} onToggle={() => toggle(key)}>
            {sectionBody(key)}
          </SectionCard>
        ))}

        {options && <LinkOptionsList options={options} />}
      </div>
    </div>
  );
}
