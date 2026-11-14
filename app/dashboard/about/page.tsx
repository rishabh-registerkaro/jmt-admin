"use client";

// About Us page editor. Edits the single AboutPageContent document that the
// JMT frontend /about page renders — every section of the live design
// (hero + quote form, metrics, pillars, accreditations, story timeline, team,
// founder quote) maps to a card below.

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Award,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  History,
  Landmark,
  Plus,
  Quote,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ABOUT_ICON_NAMES,
  ABOUT_META_DEFAULTS,
  defaultAboutContent,
  type AboutPageContent,
} from "@/app/lib/content/about-content";
import { revalidateTags } from "@/lib/revalidateClient";

// ─── Shared styles (same idiom as the services editor) ───────────────────────

const inputCls =
  "w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
const textareaCls = `${inputCls} resize-y`;
const selectCls =
  "rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
const cardWrapCls = "bg-muted/40 p-4 rounded-lg border border-border";
const labelCls = "text-sm font-medium text-foreground";
const addBtnCls =
  "";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function IconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const known = (ABOUT_ICON_NAMES as readonly string[]).includes(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectCls} w-full`}
    >
      {!known && value && <option value={value}>{value} (custom)</option>}
      {ABOUT_ICON_NAMES.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title="Remove"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className={addBtnCls}>
      <Plus className="h-4 w-4 mr-1" /> {label}
    </Button>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) =>
              onChange(items.map((it, idx) => (idx === i ? e.target.value : it)))
            }
          />
          <RemoveButton onClick={() => onChange(items.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ""])} label={addLabel} />
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible.Root open={open} onOpenChange={onToggle}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Collapsible.Trigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <span className="text-lg font-semibold text-foreground">{title}</span>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
              </div>
            </div>
            {open ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6 space-y-4 border-t border-border">{children}</div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}

// Merge a stored document with the defaults so missing keys never crash the form
function normalizeAbout(raw: unknown): AboutPageContent {
  const d = defaultAboutContent();
  if (!raw || typeof raw !== "object") return d;
  const c = raw as Partial<AboutPageContent>;
  return {
    hero: { ...d.hero, ...(c.hero || {}), form: { ...d.hero.form, ...(c.hero?.form || {}) } },
    metrics: Array.isArray(c.metrics) ? c.metrics : d.metrics,
    pillars: { ...d.pillars, ...(c.pillars || {}) },
    accreditations: { ...d.accreditations, ...(c.accreditations || {}) },
    story: { ...d.story, ...(c.story || {}) },
    team: { ...d.team, ...(c.team || {}) },
    founder: { ...d.founder, ...(c.founder || {}) },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutDashboardPage() {
  const [metaTitle, setMetaTitle] = useState(ABOUT_META_DEFAULTS.metaTitle);
  const [metaDescription, setMetaDescription] = useState(ABOUT_META_DEFAULTS.metaDescription);
  const [content, setInternalContent] = useState<AboutPageContent>(defaultAboutContent());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ seo: true, hero: true });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const set = <K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) =>
    setInternalContent((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/about", { credentials: "include" });
        const data = await res.json();
        if (data.success && data.aboutPage) {
          setMetaTitle(data.aboutPage.metaTitle ?? ABOUT_META_DEFAULTS.metaTitle);
          setMetaDescription(
            data.aboutPage.metaDescription ?? ABOUT_META_DEFAULTS.metaDescription
          );
          setInternalContent(normalizeAbout(data.aboutPage.content));
        }
      } catch {
        toast.error("Failed to load the about page", { closeButton: true });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRevalidate = async () => {
    await revalidateTags(["about-page"]);
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving...", { closeButton: true });
    try {
      const res = await fetch("/api/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metaTitle, metaDescription, content }),
      });
      const data = await res.json();
      toast.dismiss(toastId);
      if (res.ok && data.success) {
        toast.success("About page saved — live site updated", { closeButton: true });
      } else {
        toast.error(data.message || "Failed to save", { closeButton: true });
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to save", { closeButton: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="text-foreground-light">Loading...</p>
      </div>
    );
  }

  const { hero, metrics, pillars, accreditations, story, team, founder } = content;

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">About Us Page</h1>
            <p className="text-muted-foreground">
              Every section of the live /about page — save to publish instantly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRevalidate}
              title="Clear frontend cache for the About page"
              className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Revalidate Cache
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6"
            >
              {saving ? "Saving..." : "Save Page"}
            </Button>
          </div>
        </div>

        {/* ── SEO ── */}
        <SectionCard icon={FileText} title="SEO / Meta" open={!!open.seo} onToggle={() => toggle("seo")}>
          <Field label="Meta Title">
            <Input className={inputCls} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </Field>
          <Field label="Meta Description">
            <textarea rows={3} className={textareaCls} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </Field>
        </SectionCard>

        {/* ── Hero ── */}
        <SectionCard
          icon={Sparkles}
          title="Hero & Quote Form"
          hint="Purple gradient banner: badge, title, CTAs, chips and the lead-capture card"
          open={!!open.hero}
          onToggle={() => toggle("hero")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Badge">
              <Input className={inputCls} value={hero.badge} onChange={(e) => set("hero", { ...hero, badge: e.target.value })} />
            </Field>
            <div />
            <Field label="Title lead">
              <Input className={inputCls} value={hero.titleLead} onChange={(e) => set("hero", { ...hero, titleLead: e.target.value })} />
            </Field>
            <Field label="Title accent (gold gradient)">
              <Input className={inputCls} value={hero.titleAccent} onChange={(e) => set("hero", { ...hero, titleAccent: e.target.value })} />
            </Field>
          </div>
          <Field label="Subtitle">
            <textarea rows={4} className={textareaCls} value={hero.subtitle} onChange={(e) => set("hero", { ...hero, subtitle: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary CTA text">
              <Input className={inputCls} value={hero.ctaPrimary.text} onChange={(e) => set("hero", { ...hero, ctaPrimary: { ...hero.ctaPrimary, text: e.target.value } })} />
            </Field>
            <Field label="Primary CTA link">
              <Input className={inputCls} value={hero.ctaPrimary.url} onChange={(e) => set("hero", { ...hero, ctaPrimary: { ...hero.ctaPrimary, url: e.target.value } })} />
            </Field>
            <Field label="Secondary CTA text">
              <Input className={inputCls} value={hero.ctaSecondary.text} onChange={(e) => set("hero", { ...hero, ctaSecondary: { ...hero.ctaSecondary, text: e.target.value } })} />
            </Field>
            <Field label="Secondary CTA link">
              <Input className={inputCls} value={hero.ctaSecondary.url} onChange={(e) => set("hero", { ...hero, ctaSecondary: { ...hero.ctaSecondary, url: e.target.value } })} />
            </Field>
          </div>
          <Field label="Trust chips">
            <div className="space-y-2">
              {hero.chips.map((chip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                    <IconSelect
                      value={chip.icon}
                      onChange={(icon) =>
                        set("hero", { ...hero, chips: hero.chips.map((c, idx) => (idx === i ? { ...c, icon } : c)) })
                      }
                    />
                    <Input
                      className={inputCls}
                      value={chip.label}
                      placeholder="e.g. 4.9 / 5 rated"
                      onChange={(e) =>
                        set("hero", { ...hero, chips: hero.chips.map((c, idx) => (idx === i ? { ...c, label: e.target.value } : c)) })
                      }
                    />
                  </div>
                  <RemoveButton onClick={() => set("hero", { ...hero, chips: hero.chips.filter((_, idx) => idx !== i) })} />
                </div>
              ))}
              <AddButton onClick={() => set("hero", { ...hero, chips: [...hero.chips, { icon: "Star", label: "" }] })} label="Add chip" />
            </div>
          </Field>
          <div className={`${cardWrapCls} space-y-4`}>
            <span className="text-sm font-semibold text-foreground-light">Quote form card</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Kicker">
                <Input className={inputCls} value={hero.form.kicker} onChange={(e) => set("hero", { ...hero, form: { ...hero.form, kicker: e.target.value } })} />
              </Field>
              <Field label="Title">
                <Input className={inputCls} value={hero.form.title} onChange={(e) => set("hero", { ...hero, form: { ...hero.form, title: e.target.value } })} />
              </Field>
            </div>
            <Field label="Service options (dropdown)">
              <StringListEditor
                items={hero.form.services}
                onChange={(services) => set("hero", { ...hero, form: { ...hero.form, services } })}
                placeholder="e.g. MEA Apostille"
                addLabel="Add service option"
              />
            </Field>
            <Field label="Trust note (under the button)">
              <Input className={inputCls} value={hero.form.note} onChange={(e) => set("hero", { ...hero, form: { ...hero.form, note: e.target.value } })} />
            </Field>
          </div>
        </SectionCard>

        {/* ── Metrics ── */}
        <SectionCard
          icon={BarChart3}
          title="Trust Metrics"
          hint='The stats strip under the hero ("15+ Years", "120+ Countries"…)'
          open={!!open.metrics}
          onToggle={() => toggle("metrics")}
        >
          <div className="space-y-2">
            {metrics.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-0">
                  <Input className={inputCls} value={m.value} placeholder="Value (15)" onChange={(e) => set("metrics", metrics.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} />
                  <Input className={inputCls} value={m.suffix} placeholder="Suffix (+)" onChange={(e) => set("metrics", metrics.map((x, idx) => (idx === i ? { ...x, suffix: e.target.value } : x)))} />
                  <Input className={inputCls} value={m.label} placeholder="Label (Years)" onChange={(e) => set("metrics", metrics.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} />
                  <Input className={inputCls} value={m.sub} placeholder="Subtext" onChange={(e) => set("metrics", metrics.map((x, idx) => (idx === i ? { ...x, sub: e.target.value } : x)))} />
                </div>
                <RemoveButton onClick={() => set("metrics", metrics.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <AddButton onClick={() => set("metrics", [...metrics, { value: "", suffix: "+", label: "", sub: "" }])} label="Add metric" />
          </div>
        </SectionCard>

        {/* ── Pillars ── */}
        <SectionCard
          icon={Landmark}
          title="Operating Pillars"
          hint='"The chain of trust" — three cards with icon, title and bullet points'
          open={!!open.pillars}
          onToggle={() => toggle("pillars")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kicker">
              <Input className={inputCls} value={pillars.kicker} onChange={(e) => set("pillars", { ...pillars, kicker: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input className={inputCls} value={pillars.heading} onChange={(e) => set("pillars", { ...pillars, heading: e.target.value })} />
            </Field>
          </div>
          <Field label="Intro">
            <textarea rows={2} className={textareaCls} value={pillars.intro} onChange={(e) => set("pillars", { ...pillars, intro: e.target.value })} />
          </Field>
          {pillars.items.map((item, i) => (
            <div key={i} className={`${cardWrapCls} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground-light">Pillar {i + 1}</span>
                <RemoveButton onClick={() => set("pillars", { ...pillars, items: pillars.items.filter((_, idx) => idx !== i) })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Icon">
                  <IconSelect value={item.icon} onChange={(icon) => set("pillars", { ...pillars, items: pillars.items.map((x, idx) => (idx === i ? { ...x, icon } : x)) })} />
                </Field>
                <Field label="Title">
                  <Input className={inputCls} value={item.title} onChange={(e) => set("pillars", { ...pillars, items: pillars.items.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)) })} />
                </Field>
              </div>
              <Field label="Points">
                <StringListEditor
                  items={item.points}
                  onChange={(points) => set("pillars", { ...pillars, items: pillars.items.map((x, idx) => (idx === i ? { ...x, points } : x)) })}
                  placeholder="Bullet point"
                  addLabel="Add point"
                />
              </Field>
            </div>
          ))}
          <AddButton onClick={() => set("pillars", { ...pillars, items: [...pillars.items, { icon: "Scale", title: "", points: [""] }] })} label="Add pillar" />
        </SectionCard>

        {/* ── Accreditations ── */}
        <SectionCard
          icon={Award}
          title="Accreditations"
          hint='"Recognized standards & frameworks" — badge cards'
          open={!!open.accred}
          onToggle={() => toggle("accred")}
        >
          <Field label="Heading">
            <Input className={inputCls} value={accreditations.heading} onChange={(e) => set("accreditations", { ...accreditations, heading: e.target.value })} />
          </Field>
          <Field label="Intro">
            <textarea rows={2} className={textareaCls} value={accreditations.intro} onChange={(e) => set("accreditations", { ...accreditations, intro: e.target.value })} />
          </Field>
          <div className="space-y-2">
            {accreditations.items.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 flex-1 min-w-0">
                  <IconSelect value={a.icon} onChange={(icon) => set("accreditations", { ...accreditations, items: accreditations.items.map((x, idx) => (idx === i ? { ...x, icon } : x)) })} />
                  <Input className={inputCls} value={a.title} placeholder="Title (ISO 27001)" onChange={(e) => set("accreditations", { ...accreditations, items: accreditations.items.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)) })} />
                  <Input className={inputCls} value={a.sub} placeholder="Subtext" onChange={(e) => set("accreditations", { ...accreditations, items: accreditations.items.map((x, idx) => (idx === i ? { ...x, sub: e.target.value } : x)) })} />
                </div>
                <RemoveButton onClick={() => set("accreditations", { ...accreditations, items: accreditations.items.filter((_, idx) => idx !== i) })} />
              </div>
            ))}
            <AddButton onClick={() => set("accreditations", { ...accreditations, items: [...accreditations.items, { icon: "ShieldCheck", title: "", sub: "" }] })} label="Add accreditation" />
          </div>
        </SectionCard>

        {/* ── Story ── */}
        <SectionCard
          icon={History}
          title="Our Story & Timeline"
          hint="Photo badge + the year-by-year journey"
          open={!!open.story}
          onToggle={() => toggle("story")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kicker">
              <Input className={inputCls} value={story.kicker} onChange={(e) => set("story", { ...story, kicker: e.target.value })} />
            </Field>
            <div />
            <Field label="Heading lead">
              <Input className={inputCls} value={story.headingLead} onChange={(e) => set("story", { ...story, headingLead: e.target.value })} />
            </Field>
            <Field label="Heading accent (italic purple)">
              <Input className={inputCls} value={story.headingAccent} onChange={(e) => set("story", { ...story, headingAccent: e.target.value })} />
            </Field>
          </div>
          <Field label="Intro">
            <textarea rows={3} className={textareaCls} value={story.intro} onChange={(e) => set("story", { ...story, intro: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Photo badge title">
              <Input className={inputCls} value={story.badgeTitle} placeholder="Est. 2009" onChange={(e) => set("story", { ...story, badgeTitle: e.target.value })} />
            </Field>
            <Field label="Photo badge subtext">
              <Input className={inputCls} value={story.badgeSub} placeholder="New Delhi, India" onChange={(e) => set("story", { ...story, badgeSub: e.target.value })} />
            </Field>
          </div>
          {story.timeline.map((t, i) => (
            <div key={i} className={`${cardWrapCls} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground-light">Milestone {i + 1}</span>
                <div className="flex items-center gap-3 ml-auto">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!t.dark}
                      onChange={(e) => set("story", { ...story, timeline: story.timeline.map((x, idx) => (idx === i ? { ...x, dark: e.target.checked } : x)) })}
                      className="accent-brand"
                    />
                    Dark style (latest milestone)
                  </label>
                  <RemoveButton onClick={() => set("story", { ...story, timeline: story.timeline.filter((_, idx) => idx !== i) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Year">
                  <Input className={inputCls} value={t.year} onChange={(e) => set("story", { ...story, timeline: story.timeline.map((x, idx) => (idx === i ? { ...x, year: e.target.value } : x)) })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Title">
                    <Input className={inputCls} value={t.title} onChange={(e) => set("story", { ...story, timeline: story.timeline.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)) })} />
                  </Field>
                </div>
              </div>
              <Field label="Description">
                <textarea rows={2} className={textareaCls} value={t.desc} onChange={(e) => set("story", { ...story, timeline: story.timeline.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x)) })} />
              </Field>
            </div>
          ))}
          <AddButton onClick={() => set("story", { ...story, timeline: [...story.timeline, { year: "", title: "", desc: "" }] })} label="Add milestone" />
        </SectionCard>

        {/* ── Team ── */}
        <SectionCard
          icon={Users}
          title="Team"
          hint='"The people behind the seal" — member cards'
          open={!!open.team}
          onToggle={() => toggle("team")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kicker">
              <Input className={inputCls} value={team.kicker} onChange={(e) => set("team", { ...team, kicker: e.target.value })} />
            </Field>
            <div />
            <Field label="Heading lead">
              <Input className={inputCls} value={team.headingLead} onChange={(e) => set("team", { ...team, headingLead: e.target.value })} />
            </Field>
            <Field label="Heading accent (italic purple)">
              <Input className={inputCls} value={team.headingAccent} onChange={(e) => set("team", { ...team, headingAccent: e.target.value })} />
            </Field>
          </div>
          <Field label="Intro">
            <textarea rows={2} className={textareaCls} value={team.intro} onChange={(e) => set("team", { ...team, intro: e.target.value })} />
          </Field>
          {team.members.map((m, i) => (
            <div key={i} className={`${cardWrapCls} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground-light">Member {i + 1}</span>
                <RemoveButton onClick={() => set("team", { ...team, members: team.members.filter((_, idx) => idx !== i) })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <Input className={inputCls} value={m.name} onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
                </Field>
                <Field label="Role">
                  <Input className={inputCls} value={m.role} onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)) })} />
                </Field>
              </div>
              <Field label="Description">
                <textarea rows={2} className={textareaCls} value={m.desc} onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x)) })} />
              </Field>
              <Field label="Photo URL">
                <Input className={inputCls} value={m.photo} placeholder="/assets/about-team-1.jpg or a Media Library URL" onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, photo: e.target.value } : x)) })} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Email (optional)">
                  <Input className={inputCls} value={m.email ?? ""} placeholder="meera@jmt.in" onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, email: e.target.value } : x)) })} />
                </Field>
                <Field label="LinkedIn URL (optional)">
                  <Input className={inputCls} value={m.linkedin ?? ""} placeholder="https://linkedin.com/in/…" onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, linkedin: e.target.value } : x)) })} />
                </Field>
                <Field label="Instagram URL (optional)">
                  <Input className={inputCls} value={m.instagram ?? ""} placeholder="https://instagram.com/…" onChange={(e) => set("team", { ...team, members: team.members.map((x, idx) => (idx === i ? { ...x, instagram: e.target.value } : x)) })} />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                The icons on the website only appear for links you fill in — leave a field empty to hide its icon.
              </p>
            </div>
          ))}
          <AddButton onClick={() => set("team", { ...team, members: [...team.members, { name: "", role: "", desc: "", photo: "" }] })} label="Add member" />
        </SectionCard>

        {/* ── Founder ── */}
        <SectionCard
          icon={Quote}
          title="Founder Quote"
          hint='"A word from our founder" — leadership card + the big quote'
          open={!!open.founder}
          onToggle={() => toggle("founder")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kicker">
              <Input className={inputCls} value={founder.kicker} onChange={(e) => set("founder", { ...founder, kicker: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input className={inputCls} value={founder.heading} onChange={(e) => set("founder", { ...founder, heading: e.target.value })} />
            </Field>
            <Field label="Founder name">
              <Input className={inputCls} value={founder.name} onChange={(e) => set("founder", { ...founder, name: e.target.value })} />
            </Field>
            <Field label="Founder role">
              <Input className={inputCls} value={founder.role} onChange={(e) => set("founder", { ...founder, role: e.target.value })} />
            </Field>
          </div>
          <Field label="Experience line">
            <Input className={inputCls} value={founder.experience} onChange={(e) => set("founder", { ...founder, experience: e.target.value })} />
          </Field>
          <Field label="Quote">
            <textarea rows={3} className={textareaCls} value={founder.quote} onChange={(e) => set("founder", { ...founder, quote: e.target.value })} />
          </Field>
          <Field label="Signature">
            <Input className={inputCls} value={founder.signature} onChange={(e) => set("founder", { ...founder, signature: e.target.value })} />
          </Field>
        </SectionCard>

        <div className="flex justify-end pb-10">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-8"
          >
            {saving ? "Saving..." : "Save Page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
