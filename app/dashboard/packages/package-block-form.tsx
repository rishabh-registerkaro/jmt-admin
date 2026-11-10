"use client";

// Shared editor for package blocks. Used by both create-package and
// update-package. A block is not a page — it is content injected into other
// pages, so alongside the usual content fields it carries `targetPages`: the
// list of page slugs it should appear on.

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  FileText,
  LayoutTemplate,
  Layers,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Type,
} from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  PACKAGE_BAND_KEYS,
  PACKAGE_ICON_NAMES,
  PACKAGE_STAT_ICON_NAMES,
  createItineraryDay,
  createPackageItem,
  createPackageTab,
  createStat,
  emptyPackageBlockContent,
  normalizeTargetPages,
  packageSlugify,
  type PackageBlockContent,
  type PackageItem,
  type PackageTab,
} from "@/app/lib/content/package-content";
import { PACKAGE_TEMPLATES } from "@/app/lib/content/package-templates";

// ─── Shared styles (matched to the service page editor) ───────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500";
const textareaCls = `${inputCls} resize-y`;
const selectCls =
  "rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500";
const cardWrapCls = "bg-slate-800/30 p-4 rounded-lg border border-slate-700";
const emptyStateCls =
  "text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-lg";
const labelCls = "text-sm font-medium text-slate-200";
const addBtnCls =
  "border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white";

// ─── Small building blocks ────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function RemoveButton({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title || "Remove"}
      className="text-red-400 hover:text-red-300 hover:bg-red-400/20 shrink-0"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function DuplicateButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className="text-indigo-300 hover:text-indigo-200 hover:bg-indigo-400/20 shrink-0"
    >
      <Copy className="h-4 w-4" />
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

function MoveButtons({
  onUp,
  onDown,
  canUp,
  canDown,
}: {
  onUp: () => void;
  onDown: () => void;
  canUp: boolean;
  canDown: boolean;
}) {
  return (
    <div className="flex items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!canUp}
        onClick={onUp}
        title="Move up"
        className="text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!canDown}
        onClick={onDown}
        title="Move down"
        className="text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Editable list of plain strings (includes, docs…). */
function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
  multiline,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
  multiline?: boolean;
}) {
  const set = (i: number, v: string) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {multiline ? (
            <textarea
              rows={2}
              className={textareaCls}
              value={item}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
            />
          ) : (
            <Input
              className={inputCls}
              value={item}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
            />
          )}
          <RemoveButton onClick={() => onChange(items.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ""])} label={addLabel} />
    </div>
  );
}

function SelectFrom({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const known = options.includes(value);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} w-full`}>
      {!known && value && <option value={value}>{value} (custom)</option>}
      {options.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

/** Collapsible panel header — icon, title and a chevron reflecting open state. */
function SectionHeader({
  icon: Icon,
  title,
  open,
}: {
  icon: typeof FileText;
  title: string;
  open: boolean;
}) {
  return (
    <div className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-indigo-400" />
        <span className="text-lg font-semibold text-white">{title}</span>
      </div>
      {open ? (
        <ChevronDown className="h-5 w-5 text-slate-400" />
      ) : (
        <ChevronRight className="h-5 w-5 text-slate-400" />
      )}
    </div>
  );
}

// ─── Package editor ───────────────────────────────────────────────────────────

function PackageEditor({
  pkg,
  onChange,
}: {
  pkg: PackageItem;
  onChange: (p: PackageItem) => void;
}) {
  const set = (patch: Partial<PackageItem>) => onChange({ ...pkg, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Package title" required>
          <Input
            className={inputCls}
            value={pkg.title}
            placeholder="Dubai & Abu Dhabi Signature"
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
        <Field
          label="Card id"
          hint="Auto-generated from the title if left blank. Must be unique within the tab."
        >
          <Input
            className={inputCls}
            value={pkg.id}
            placeholder="dubai"
            onChange={(e) => set({ id: packageSlugify(e.target.value) })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Region" required hint="Also fills the enquiry form's Region dropdown">
          <Input
            className={inputCls}
            value={pkg.region}
            placeholder="UAE"
            onChange={(e) => set({ region: e.target.value })}
          />
        </Field>
        <Field label="Duration">
          <Input
            className={inputCls}
            value={pkg.duration}
            placeholder="5N / 6D"
            onChange={(e) => set({ duration: e.target.value })}
          />
        </Field>
        <Field label="Best season">
          <Input
            className={inputCls}
            value={pkg.season}
            placeholder="Oct – Mar"
            onChange={(e) => set({ season: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Price">
          <Input
            className={inputCls}
            value={pkg.price}
            placeholder="₹64,900"
            onChange={(e) => set({ price: e.target.value })}
          />
        </Field>
        <Field label="Was price" hint="Struck through. Leave blank to hide.">
          <Input
            className={inputCls}
            value={pkg.old}
            placeholder="₹72,400"
            onChange={(e) => set({ old: e.target.value })}
          />
        </Field>
        <Field label="Card icon">
          <SelectFrom
            value={pkg.icon}
            options={PACKAGE_ICON_NAMES}
            onChange={(v) => set({ icon: v })}
          />
        </Field>
        <Field label="Card gradient">
          <SelectFrom
            value={pkg.band}
            options={PACKAGE_BAND_KEYS}
            onChange={(v) => set({ band: v })}
          />
        </Field>
      </div>

      <Field label="Summary" hint="Shown in the detail panel header, under the title">
        <textarea
          rows={3}
          className={textareaCls}
          value={pkg.summary}
          placeholder="Skyline landmarks, a desert night and the Grand Mosque…"
          onChange={(e) => set({ summary: e.target.value })}
        />
      </Field>

      {/* Itinerary */}
      <div className="space-y-2">
        <label className={labelCls}>Day-by-day itinerary</label>
        {pkg.itinerary.length === 0 ? (
          <div className={emptyStateCls}>No itinerary days yet</div>
        ) : (
          <div className="space-y-3">
            {pkg.itinerary.map((day, i) => (
              <div key={i} className={cardWrapCls}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-400">Day row {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <MoveButtons
                      canUp={i > 0}
                      canDown={i < pkg.itinerary.length - 1}
                      onUp={() => {
                        const next = [...pkg.itinerary];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        set({ itinerary: next });
                      }}
                      onDown={() => {
                        const next = [...pkg.itinerary];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        set({ itinerary: next });
                      }}
                    />
                    <RemoveButton
                      onClick={() => set({ itinerary: pkg.itinerary.filter((_, idx) => idx !== i) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    className={inputCls}
                    value={day.d}
                    placeholder="Day 1"
                    onChange={(e) =>
                      set({
                        itinerary: pkg.itinerary.map((it, idx) =>
                          idx === i ? { ...it, d: e.target.value } : it
                        ),
                      })
                    }
                  />
                  <Input
                    className={`${inputCls} md:col-span-2`}
                    value={day.t}
                    placeholder="Arrival & Dubai Marina evening"
                    onChange={(e) =>
                      set({
                        itinerary: pkg.itinerary.map((it, idx) =>
                          idx === i ? { ...it, t: e.target.value } : it
                        ),
                      })
                    }
                  />
                </div>
                <textarea
                  rows={2}
                  className={`${textareaCls} mt-3`}
                  value={day.x}
                  placeholder="Airport pickup, hotel check-in, then a dhow cruise…"
                  onChange={(e) =>
                    set({
                      itinerary: pkg.itinerary.map((it, idx) =>
                        idx === i ? { ...it, x: e.target.value } : it
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
        <AddButton
          onClick={() => set({ itinerary: [...pkg.itinerary, createItineraryDay()] })}
          label="Add day"
        />
      </div>

      <Field label="What's included">
        <StringListEditor
          items={pkg.includes}
          onChange={(includes) => set({ includes })}
          placeholder="5 nights in 4★ hotels with daily breakfast"
          addLabel="Add inclusion"
        />
      </Field>

      {/* Stats */}
      <div className="space-y-2">
        <label className={labelCls}>Stat tiles</label>
        {pkg.stats.length === 0 ? (
          <div className={emptyStateCls}>No stat tiles yet</div>
        ) : (
          <div className="space-y-2">
            {pkg.stats.map((stat, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                  <SelectFrom
                    value={stat.icon}
                    options={PACKAGE_STAT_ICON_NAMES}
                    onChange={(v) =>
                      set({ stats: pkg.stats.map((s, idx) => (idx === i ? { ...s, icon: v } : s)) })
                    }
                  />
                  <Input
                    className={inputCls}
                    value={stat.v}
                    placeholder="2–24 pax"
                    onChange={(e) =>
                      set({
                        stats: pkg.stats.map((s, idx) =>
                          idx === i ? { ...s, v: e.target.value } : s
                        ),
                      })
                    }
                  />
                  <Input
                    className={inputCls}
                    value={stat.k}
                    placeholder="Group size"
                    onChange={(e) =>
                      set({
                        stats: pkg.stats.map((s, idx) =>
                          idx === i ? { ...s, k: e.target.value } : s
                        ),
                      })
                    }
                  />
                </div>
                <RemoveButton
                  onClick={() => set({ stats: pkg.stats.filter((_, idx) => idx !== i) })}
                />
              </div>
            ))}
          </div>
        )}
        <AddButton onClick={() => set({ stats: [...pkg.stats, createStat()] })} label="Add stat" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Documents box title">
          <Input
            className={inputCls}
            value={pkg.docsTitle}
            placeholder="Visa & documents we handle"
            onChange={(e) => set({ docsTitle: e.target.value })}
          />
        </Field>
        <Field label="Documents list">
          <StringListEditor
            items={pkg.docs}
            onChange={(docs) => set({ docs })}
            placeholder="Tourist visa filing, appointment & tracking"
            addLabel="Add document line"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Normalization / cleanup ──────────────────────────────────────────────────

const trimList = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

/**
 * Fill in any field missing from a stored block so older documents keep working
 * after new fields are added. Exported for the update page.
 */
export function normalizeContent(raw: unknown): PackageBlockContent {
  const base = emptyPackageBlockContent();
  const c = (raw ?? {}) as Partial<PackageBlockContent>;
  const tabs: PackageTab[] = Array.isArray(c.tabs)
    ? c.tabs.map((tab) => ({
        id: tab?.id ?? "",
        label: tab?.label ?? "",
        packages: Array.isArray(tab?.packages)
          ? tab.packages.map((p) => ({ ...createPackageItem(), ...p }))
          : [],
      }))
    : [];
  return {
    ...base,
    ...c,
    enquiry: { ...base.enquiry, ...(c.enquiry ?? {}) },
    tabs,
  };
}

/** Drop empty rows and trim strings so the stored JSON stays clean. */
function cleanContent(content: PackageBlockContent): PackageBlockContent {
  return {
    ...content,
    anchorId: packageSlugify(content.anchorId) || "packages",
    tocLabel: content.tocLabel.trim() || "Packages",
    badge: content.badge.trim(),
    heading: content.heading.trim(),
    subtitle: content.subtitle.trim(),
    tabs: content.tabs
      .map((tab) => ({
        id: packageSlugify(tab.id) || packageSlugify(tab.label),
        label: tab.label.trim(),
        packages: tab.packages
          .map((p) => ({
            ...p,
            id: packageSlugify(p.id) || packageSlugify(p.title),
            title: p.title.trim(),
            region: p.region.trim(),
            summary: p.summary.trim(),
            itinerary: p.itinerary.filter((d) => d.d.trim() || d.t.trim() || d.x.trim()),
            includes: trimList(p.includes),
            stats: p.stats.filter((s) => s.v.trim() || s.k.trim()),
            docs: trimList(p.docs),
          }))
          .filter((p) => p.title),
      }))
      .filter((tab) => tab.label),
  };
}

// ─── Main form ────────────────────────────────────────────────────────────────

export type PackageBlockFormData = {
  slug: string;
  title: string;
  targetPages: string[];
  /** Frontend on/off switch, independent of draft/published */
  visible: boolean;
  content: PackageBlockContent;
};

export function emptyFormData(): PackageBlockFormData {
  return {
    slug: "",
    title: "",
    targetPages: [],
    visible: true,
    content: emptyPackageBlockContent(),
  };
}

const generateSlug = (t: string) =>
  t
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Lenient sanitizer for manual typing — keeps a trailing "-" so dashes can be typed. */
const typeSlug = (t: string) =>
  t
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");

/** The id a row will actually be saved with — explicit id wins, else the label. */
const effectiveId = (id: string, label: string) =>
  packageSlugify(id) || packageSlugify(label);

/**
 * "<base>-copy", "<base>-copy-2"… — the first id not already in `existing`.
 *
 * A copy gets a real id up front rather than an empty one: two copies of the
 * same row would otherwise both slugify their "(Copy)" title to the same value,
 * and ids must be unique within their tab (packages) and block (tabs) — the
 * frontend uses them as React keys and as the open-card / active-tab target.
 */
const copyId = (existing: string[], base: string) => {
  const taken = new Set(existing.filter(Boolean));
  const root = `${base || "item"}-copy`;
  if (!taken.has(root)) return root;
  for (let n = 2; n <= taken.size + 2; n++) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${taken.size + 3}`;
};

export default function PackageBlockForm({
  mode,
  initialData,
  originalSlug,
}: {
  mode: "create" | "update";
  initialData?: PackageBlockFormData;
  originalSlug?: string;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<PackageBlockFormData>(
    initialData ?? emptyFormData()
  );
  const [loading, setLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(mode === "create");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    meta: true,
    header: true,
  });
  const [openTabs, setOpenTabs] = useState<Record<number, boolean>>({ 0: true });
  const [openPackages, setOpenPackages] = useState<Record<string, boolean>>({});
  /** Slugs of existing service pages, offered as suggestions for target pages */
  const [pageSuggestions, setPageSuggestions] = useState<string[]>([]);

  const toggle = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const content = formData.content;
  const setContent = (patch: Partial<PackageBlockContent>) =>
    setFormData((p) => ({ ...p, content: { ...p.content, ...patch } }));

  // Target pages are free text (a block can be prepared before its page exists),
  // but the slugs of pages that DO exist are offered as autocomplete so typos
  // — which would silently render the block nowhere — are easy to avoid.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/services?page=1&limit=50", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const slugs = (data?.servicePages ?? [])
          .map((s: { slug?: string }) => s?.slug)
          .filter((s: unknown): s is string => typeof s === "string" && s.length > 0);
        setPageSuggestions(slugs);
      } catch {
        // Suggestions are a convenience only — free-text entry still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Template picker (create mode) ─────────────────────────────────────────

  const applyTemplate = (key: string) => {
    const tpl = PACKAGE_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    setFormData({
      slug: tpl.slug,
      title: tpl.title,
      targetPages: [...tpl.targetPages],
      visible: true,
      content: structuredClone(tpl.content),
    });
    setAutoGenerateSlug(!tpl.slug);
    setOpenTabs({ 0: true });
    toast.success(`Loaded "${tpl.name}" template`, { closeButton: true });
  };

  // ── Title / slug ──────────────────────────────────────────────────────────

  const updateTitle = (value: string) =>
    setFormData((p) => ({
      ...p,
      title: value,
      slug: autoGenerateSlug ? generateSlug(value) : p.slug,
      // The heading tracks the title until the admin edits it separately
      content: p.content.heading === p.title ? { ...p.content, heading: value } : p.content,
    }));

  // ── Tab / package helpers ─────────────────────────────────────────────────

  const setTab = (i: number, patch: Partial<PackageTab>) =>
    setContent({ tabs: content.tabs.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });

  const moveTab = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= content.tabs.length) return;
    const tabs = [...content.tabs];
    [tabs[i], tabs[target]] = [tabs[target], tabs[i]];
    setContent({ tabs });
  };

  const setPackage = (ti: number, pi: number, pkg: PackageItem) =>
    setTab(ti, {
      packages: content.tabs[ti].packages.map((p, idx) => (idx === pi ? pkg : p)),
    });

  const movePackage = (ti: number, pi: number, dir: -1 | 1) => {
    const target = pi + dir;
    const packages = [...content.tabs[ti].packages];
    if (target < 0 || target >= packages.length) return;
    [packages[pi], packages[target]] = [packages[target], packages[pi]];
    setTab(ti, { packages });
  };

  // ── Duplicate ─────────────────────────────────────────────────────────────
  // Copying a row beats retyping it. The copy is inserted directly below its
  // source and opened, with a fresh unique id so the two never clash.
  //
  // Both open/closed maps are keyed by index ({ 2: true }, { "0-1": true }), so
  // an insert has to shift every key after the insertion point — otherwise the
  // wrong rows would appear expanded.

  const duplicatePackage = (ti: number, pi: number) => {
    const packages = [...content.tabs[ti].packages];
    const source = packages[pi];
    if (!source) return;

    packages.splice(pi + 1, 0, {
      ...structuredClone(source),
      id: copyId(
        packages.map((p) => effectiveId(p.id, p.title)),
        effectiveId(source.id, source.title)
      ),
      title: source.title.trim() ? `${source.title.trim()} (Copy)` : "",
    });
    setTab(ti, { packages });

    setOpenPackages((prev) => {
      const next: Record<string, boolean> = {};
      for (const [key, open] of Object.entries(prev)) {
        const [t, p] = key.split("-").map(Number);
        next[t === ti && p > pi ? `${t}-${p + 1}` : key] = open;
      }
      next[`${ti}-${pi + 1}`] = true;
      return next;
    });

    toast.success("Package duplicated — edit the copy below", { closeButton: true });
  };

  const duplicateTab = (i: number) => {
    const tabs = [...content.tabs];
    const source = tabs[i];
    if (!source) return;

    // Package ids only need to be unique within their own tab, so the copied
    // packages keep theirs — only the tab id has to be new.
    tabs.splice(i + 1, 0, {
      ...structuredClone(source),
      id: copyId(
        tabs.map((t) => effectiveId(t.id, t.label)),
        effectiveId(source.id, source.label)
      ),
      label: source.label.trim() ? `${source.label.trim()} (Copy)` : "",
    });
    setContent({ tabs });

    setOpenTabs((prev) => {
      const next: Record<number, boolean> = {};
      for (const [key, open] of Object.entries(prev)) {
        const t = Number(key);
        next[t > i ? t + 1 : t] = open;
      }
      next[i + 1] = true;
      return next;
    });
    setOpenPackages((prev) => {
      const next: Record<string, boolean> = {};
      for (const [key, open] of Object.entries(prev)) {
        const [t, p] = key.split("-").map(Number);
        next[`${t > i ? t + 1 : t}-${p}`] = open;
      }
      return next;
    });

    toast.success(
      `Tab duplicated with ${source.packages.length} package${
        source.packages.length === 1 ? "" : "s"
      }`,
      { closeButton: true }
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (status: "draft" | "published") => {
    const cleanSlug = generateSlug(formData.slug);
    if (!cleanSlug) {
      toast.error("Please enter a slug for this block", { closeButton: true });
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a block title", { closeButton: true });
      return;
    }

    const targetPages = normalizeTargetPages(formData.targetPages);
    if (status === "published" && targetPages.length === 0) {
      toast.error("Add at least one target page before publishing — otherwise the block renders nowhere", {
        closeButton: true,
      });
      return;
    }

    const cleaned = cleanContent(content);
    if (status === "published" && cleaned.tabs.length === 0) {
      toast.error("Add at least one tab with a package before publishing", {
        closeButton: true,
      });
      return;
    }
    const emptyTab = cleaned.tabs.find((t) => t.packages.length === 0);
    if (emptyTab) {
      toast.error(`Tab "${emptyTab.label}" has no packages`, { closeButton: true });
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      status === "published" ? "Publishing..." : "Saving draft...",
      { closeButton: true }
    );

    try {
      const payload = {
        slug: cleanSlug,
        title: formData.title.trim(),
        targetPages,
        visible: formData.visible,
        content: cleaned,
        status,
      };

      const url = mode === "create" ? "/api/packages" : `/api/packages/${originalSlug}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok) {
        toast.success(data.message || "Saved successfully!", { closeButton: true });
        setTimeout(() => router.push("/dashboard/packages"), 1000);
      } else {
        toast.error(data.message || "Failed to save", { closeButton: true });
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Something went wrong", {
        closeButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const card =
    "bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden";

  return (
    <div className="space-y-4">
      {mode === "create" && (
        <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
          <div className="flex items-center gap-2 text-slate-200">
            <LayoutTemplate className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-medium">Start from a template:</span>
          </div>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && applyTemplate(e.target.value)}
            className={`${selectCls} flex-1 max-w-md`}
          >
            <option value="" disabled>
              Choose a template…
            </option>
            {PACKAGE_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name} — {t.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Block settings & placement ──────────────────────────────────────── */}
      <Collapsible.Root open={openSections.meta} onOpenChange={() => toggle("meta")}>
        <div className={card}>
          <Collapsible.Trigger asChild>
            <button className="w-full">
              <SectionHeader icon={Target} title="Block settings & placement" open={openSections.meta} />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-6 pt-2 space-y-4 border-t border-white/10">
              <Field label="Block title" required hint="Internal name, also used as the default heading">
                <Input
                  className={inputCls}
                  value={formData.title}
                  placeholder="Holiday Tour Packages"
                  onChange={(e) => updateTitle(e.target.value)}
                />
              </Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>
                    Block slug <span className="text-red-400">*</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateSlug}
                      onChange={(e) => {
                        const auto = e.target.checked;
                        setAutoGenerateSlug(auto);
                        if (auto)
                          setFormData((p) => ({ ...p, slug: generateSlug(p.title) }));
                      }}
                      className="accent-indigo-500"
                    />
                    Auto-generate from title
                  </label>
                </div>
                <Input
                  className={`${inputCls} ${autoGenerateSlug ? "opacity-60 cursor-not-allowed" : ""}`}
                  value={formData.slug}
                  placeholder="holiday-tour-packages"
                  disabled={autoGenerateSlug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: typeSlug(e.target.value) }))}
                />
                <p className="text-xs text-slate-500">
                  Identifies the block itself — it is not a public URL.
                </p>
              </div>

              <Field
                label="Target pages"
                required
                hint="Page slugs this block is injected into, without the leading slash. It appears after the 2nd content section of each page."
              >
                <div className="space-y-2">
                  {formData.targetPages.length === 0 ? (
                    <div className={emptyStateCls}>
                      No target pages — this block will not appear anywhere
                    </div>
                  ) : (
                    formData.targetPages.map((slug, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex-1">
                          <Input
                            className={inputCls}
                            list="package-page-suggestions"
                            value={slug}
                            placeholder="travel"
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                targetPages: p.targetPages.map((s, idx) =>
                                  idx === i ? typeSlug(e.target.value) : s
                                ),
                              }))
                            }
                          />
                          {slug && !pageSuggestions.includes(slug) && (
                            <p className="text-xs text-amber-400/80 mt-1">
                              No service page with this slug yet — the block stays hidden
                              until one is published at /{slug}
                            </p>
                          )}
                        </div>
                        <RemoveButton
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              targetPages: p.targetPages.filter((_, idx) => idx !== i),
                            }))
                          }
                        />
                      </div>
                    ))
                  )}
                  <datalist id="package-page-suggestions">
                    {pageSuggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <AddButton
                    onClick={() =>
                      setFormData((p) => ({ ...p, targetPages: [...p.targetPages, ""] }))
                    }
                    label="Add target page"
                  />
                </div>
              </Field>

              {/* Frontend on/off — deliberately separate from Draft/Publish so a
                  finished block can be pulled off the live pages and put back
                  without losing its published state. */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, visible: e.target.checked }))
                    }
                    className="accent-indigo-500 mt-0.5 h-4 w-4"
                  />
                  <span>
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      {formData.visible ? (
                        <>
                          <Eye className="h-4 w-4 text-green-400" />
                          Showing on the website
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-amber-400" />
                          Hidden from the website
                        </>
                      )}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      {formData.visible
                        ? "Untick to pull this block off the live pages while keeping it published."
                        : "Still published and saved — visitors just won't see it until you tick this again."}
                    </span>
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Anchor id" hint="Used for the in-page link, e.g. #packages">
                  <Input
                    className={inputCls}
                    value={content.anchorId}
                    placeholder="packages"
                    onChange={(e) => setContent({ anchorId: typeSlug(e.target.value) })}
                  />
                </Field>
                <Field label="Sidebar label" hint="How the block is listed in the page's contents">
                  <Input
                    className={inputCls}
                    value={content.tocLabel}
                    placeholder="Tour Packages"
                    onChange={(e) => setContent({ tocLabel: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* ── Section header ──────────────────────────────────────────────────── */}
      <Collapsible.Root open={openSections.header} onOpenChange={() => toggle("header")}>
        <div className={card}>
          <Collapsible.Trigger asChild>
            <button className="w-full">
              <SectionHeader icon={Sparkles} title="Section header" open={openSections.header} />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-6 pt-2 space-y-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Field label="Badge text">
                    <Input
                      className={inputCls}
                      value={content.badge}
                      placeholder="INTERNATIONAL & DOMESTIC TOURISM"
                      onChange={(e) => setContent({ badge: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Badge icon">
                  <SelectFrom
                    value={content.badgeIcon}
                    options={PACKAGE_ICON_NAMES}
                    onChange={(v) => setContent({ badgeIcon: v })}
                  />
                </Field>
              </div>
              <Field label="Heading">
                <Input
                  className={inputCls}
                  value={content.heading}
                  placeholder="Holiday Tour Packages"
                  onChange={(e) => setContent({ heading: e.target.value })}
                />
              </Field>
              <Field label="Subtitle">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={content.subtitle}
                  placeholder="Tap any package and its full itinerary drops down right below it…"
                  onChange={(e) => setContent({ subtitle: e.target.value })}
                />
              </Field>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* ── Tabs & packages ─────────────────────────────────────────────────── */}
      <div className={card}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-semibold text-white">Tabs & packages</span>
          </div>
          <AddButton
            onClick={() => {
              setContent({ tabs: [...content.tabs, createPackageTab()] });
              setOpenTabs((p) => ({ ...p, [content.tabs.length]: true }));
            }}
            label="Add tab"
          />
        </div>
        <div className="p-6 space-y-4">
          {content.tabs.length === 0 ? (
            <div className={emptyStateCls}>
              No tabs yet. A block needs at least one tab (e.g. &quot;International&quot;).
            </div>
          ) : (
            content.tabs.map((tab, ti) => (
              <Collapsible.Root
                key={ti}
                open={openTabs[ti] ?? false}
                onOpenChange={() => setOpenTabs((p) => ({ ...p, [ti]: !p[ti] }))}
              >
                <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/30">
                  <div className="flex items-center justify-between p-3 bg-slate-800/40">
                    <Collapsible.Trigger asChild>
                      <button className="flex items-center gap-2 text-left flex-1">
                        {openTabs[ti] ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm font-semibold text-white">
                          {tab.label || `Tab ${ti + 1}`}
                        </span>
                        <span className="text-xs text-slate-500">
                          {tab.packages.length} package{tab.packages.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    </Collapsible.Trigger>
                    <div className="flex items-center gap-1">
                      <MoveButtons
                        canUp={ti > 0}
                        canDown={ti < content.tabs.length - 1}
                        onUp={() => moveTab(ti, -1)}
                        onDown={() => moveTab(ti, 1)}
                      />
                      <DuplicateButton
                        onClick={() => duplicateTab(ti)}
                        title="Duplicate this tab and all its packages"
                      />
                      <RemoveButton
                        onClick={() =>
                          setContent({ tabs: content.tabs.filter((_, idx) => idx !== ti) })
                        }
                      />
                    </div>
                  </div>
                  <Collapsible.Content>
                    <div className="p-4 space-y-4 border-t border-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Tab label" required>
                          <Input
                            className={inputCls}
                            value={tab.label}
                            placeholder="International"
                            onChange={(e) => setTab(ti, { label: e.target.value })}
                          />
                        </Field>
                        <Field label="Tab id" hint="Auto-generated from the label if left blank">
                          <Input
                            className={inputCls}
                            value={tab.id}
                            placeholder="intl"
                            onChange={(e) => setTab(ti, { id: typeSlug(e.target.value) })}
                          />
                        </Field>
                      </div>

                      <div className="space-y-3">
                        {tab.packages.length === 0 ? (
                          <div className={emptyStateCls}>No packages in this tab yet</div>
                        ) : (
                          tab.packages.map((pkg, pi) => {
                            const key = `${ti}-${pi}`;
                            return (
                              <Collapsible.Root
                                key={pi}
                                open={openPackages[key] ?? false}
                                onOpenChange={() =>
                                  setOpenPackages((p) => ({ ...p, [key]: !p[key] }))
                                }
                              >
                                <div className={cardWrapCls}>
                                  <div className="flex items-center justify-between gap-2">
                                    <Collapsible.Trigger asChild>
                                      <button className="flex items-center gap-2 text-left flex-1">
                                        {openPackages[key] ? (
                                          <ChevronDown className="h-4 w-4 text-slate-400" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-slate-400" />
                                        )}
                                        <span className="text-sm font-medium text-slate-100">
                                          {pkg.title || `Package ${pi + 1}`}
                                        </span>
                                        {pkg.region && (
                                          <span className="text-xs text-slate-500">
                                            {pkg.region}
                                          </span>
                                        )}
                                      </button>
                                    </Collapsible.Trigger>
                                    <div className="flex items-center gap-1">
                                      <MoveButtons
                                        canUp={pi > 0}
                                        canDown={pi < tab.packages.length - 1}
                                        onUp={() => movePackage(ti, pi, -1)}
                                        onDown={() => movePackage(ti, pi, 1)}
                                      />
                                      <DuplicateButton
                                        onClick={() => duplicatePackage(ti, pi)}
                                        title="Duplicate this package"
                                      />
                                      <RemoveButton
                                        onClick={() =>
                                          setTab(ti, {
                                            packages: tab.packages.filter((_, idx) => idx !== pi),
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <Collapsible.Content>
                                    <div className="pt-4 mt-4 border-t border-slate-700">
                                      <PackageEditor
                                        pkg={pkg}
                                        onChange={(p) => setPackage(ti, pi, p)}
                                      />
                                    </div>
                                  </Collapsible.Content>
                                </div>
                              </Collapsible.Root>
                            );
                          })
                        )}
                        <AddButton
                          onClick={() => {
                            setTab(ti, { packages: [...tab.packages, createPackageItem()] });
                            setOpenPackages((p) => ({
                              ...p,
                              [`${ti}-${tab.packages.length}`]: true,
                            }));
                          }}
                          label="Add package"
                        />
                      </div>
                    </div>
                  </Collapsible.Content>
                </div>
              </Collapsible.Root>
            ))
          )}
        </div>
      </div>

      {/* ── Wording ─────────────────────────────────────────────────────────── */}
      <Collapsible.Root open={openSections.wording} onOpenChange={() => toggle("wording")}>
        <div className={card}>
          <Collapsible.Trigger asChild>
            <button className="w-full">
              <SectionHeader icon={Type} title="Detail panel wording" open={!!openSections.wording} />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10">
              <Field label="Itinerary heading">
                <Input
                  className={inputCls}
                  value={content.itineraryTitle}
                  onChange={(e) => setContent({ itineraryTitle: e.target.value })}
                />
              </Field>
              <Field label="Includes heading">
                <Input
                  className={inputCls}
                  value={content.includesTitle}
                  onChange={(e) => setContent({ includesTitle: e.target.value })}
                />
              </Field>
              <Field label="Price small print">
                <Input
                  className={inputCls}
                  value={content.priceNote}
                  onChange={(e) => setContent({ priceNote: e.target.value })}
                />
              </Field>
              <Field label="Callback reassurance line">
                <Input
                  className={inputCls}
                  value={content.callbackNote}
                  onChange={(e) => setContent({ callbackNote: e.target.value })}
                />
              </Field>
              <Field label="Enquiry button text">
                <Input
                  className={inputCls}
                  value={content.enquireCta}
                  onChange={(e) => setContent({ enquireCta: e.target.value })}
                />
              </Field>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* ── Enquiry popup ───────────────────────────────────────────────────── */}
      <Collapsible.Root open={openSections.enquiry} onOpenChange={() => toggle("enquiry")}>
        <div className={card}>
          <Collapsible.Trigger asChild>
            <button className="w-full">
              <SectionHeader
                icon={MessageSquare}
                title="Enquiry popup"
                open={!!openSections.enquiry}
              />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-6 pt-2 space-y-4 border-t border-white/10">
              <p className="text-xs text-slate-400">
                Submissions land in Leads, tagged with the package name and region.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Kicker">
                  <Input
                    className={inputCls}
                    value={content.enquiry.kicker}
                    onChange={(e) =>
                      setContent({ enquiry: { ...content.enquiry, kicker: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Region field label">
                  <Input
                    className={inputCls}
                    value={content.enquiry.regionLabel}
                    onChange={(e) =>
                      setContent({ enquiry: { ...content.enquiry, regionLabel: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Submit button text">
                  <Input
                    className={inputCls}
                    value={content.enquiry.ctaText}
                    onChange={(e) =>
                      setContent({ enquiry: { ...content.enquiry, ctaText: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Success heading">
                  <Input
                    className={inputCls}
                    value={content.enquiry.successHeading}
                    onChange={(e) =>
                      setContent({
                        enquiry: { ...content.enquiry, successHeading: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="Success message" hint="{region} is replaced with the package's region">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={content.enquiry.successText}
                  onChange={(e) =>
                    setContent({ enquiry: { ...content.enquiry, successText: e.target.value } })
                  }
                />
              </Field>
              <Field label="Success button text">
                <Input
                  className={inputCls}
                  value={content.enquiry.successButton}
                  onChange={(e) =>
                    setContent({ enquiry: { ...content.enquiry, successButton: e.target.value } })
                  }
                />
              </Field>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className={`${card} p-4 flex flex-col sm:flex-row gap-3 sm:justify-end`}>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => handleSubmit("draft")}
          className={addBtnCls}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit("published")}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          {loading ? "Saving…" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
