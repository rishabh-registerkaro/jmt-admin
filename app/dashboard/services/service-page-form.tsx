"use client";

// Shared editor for service/division pages. Used by both create-service and
// update-service. The form edits a single `ServicePageContent` document
// (hero + ordered sections) that maps 1:1 onto the frontend ServiceLayout,
// so any section can be added, removed or reordered without schema changes.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  LayoutTemplate,
  ListPlus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ICON_NAMES,
  SECTION_KIND_LABELS,
  createSection,
  emptyServicePageContent,
  type CardsSection,
  type ChecklistSection,
  type ChipsSection,
  type FaqSection,
  type IntroSection,
  type NotesSection,
  type Section,
  type SectionKind,
  type ServicePageContent,
  type StepsSection,
  type TableSection,
} from "@/app/lib/content/service-content";
import { SERVICE_TEMPLATES } from "@/app/lib/content/service-templates";

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
const textareaCls = `${inputCls} resize-y`;
const selectCls =
  "rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
const cardWrapCls = "bg-muted/40 p-4 rounded-lg border border-border";
const emptyStateCls =
  "text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg";
const labelCls = "text-sm font-medium text-foreground";
const addBtnCls =
  "";

// ─── Small building blocks ────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>
        {label} {required && <span className="text-destructive">*</span>}
      </label>
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
  const known = (ICON_NAMES as readonly string[]).includes(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectCls} w-full`}
    >
      {!known && value && <option value={value}>{value} (custom)</option>}
      {ICON_NAMES.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
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

/** Editable list of plain strings (chips, bullets, checklist items…). */
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
  const set = (i: number, v: string) =>
    onChange(items.map((it, idx) => (idx === i ? v : it)));
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

function OptionalIntroField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="Section intro (optional)">
      <textarea
        rows={2}
        className={textareaCls}
        value={value ?? ""}
        placeholder="Short line rendered under the section heading"
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

// ─── Per-kind section editors ─────────────────────────────────────────────────

function IntroEditor({
  section,
  onChange,
}: {
  section: IntroSection;
  onChange: (s: IntroSection) => void;
}) {
  const stats = section.stats ?? [];
  const setStat = (i: number, patch: Partial<(typeof stats)[number]>) =>
    onChange({
      ...section,
      stats: stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  return (
    <div className="space-y-4">
      <Field label="Paragraphs" required>
        <StringListEditor
          items={section.paragraphs}
          onChange={(paragraphs) => onChange({ ...section, paragraphs })}
          placeholder="Paragraph text"
          addLabel="Add paragraph"
          multiline
        />
      </Field>
      <Field label="Stats (optional)">
        <div className="space-y-2">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <IconSelect value={stat.icon} onChange={(icon) => setStat(i, { icon })} />
                <Input
                  className={inputCls}
                  value={stat.value}
                  placeholder="Value (e.g. 120+)"
                  onChange={(e) => setStat(i, { value: e.target.value })}
                />
                <Input
                  className={inputCls}
                  value={stat.label}
                  placeholder="Label"
                  onChange={(e) => setStat(i, { label: e.target.value })}
                />
              </div>
              <RemoveButton
                onClick={() =>
                  onChange({ ...section, stats: stats.filter((_, idx) => idx !== i) })
                }
              />
            </div>
          ))}
          <AddButton
            onClick={() =>
              onChange({
                ...section,
                stats: [...stats, { icon: "Globe", value: "", label: "" }],
              })
            }
            label="Add stat"
          />
        </div>
      </Field>
    </div>
  );
}

function CardsEditor({
  section,
  onChange,
}: {
  section: CardsSection;
  onChange: (s: CardsSection) => void;
}) {
  const setCard = (i: number, patch: Partial<(typeof section.cards)[number]>) =>
    onChange({
      ...section,
      cards: section.cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    });
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      {section.cards.length === 0 && <div className={emptyStateCls}>No cards yet</div>}
      {section.cards.map((card, i) => (
        <div key={i} className={`${cardWrapCls} space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground-light">Card {i + 1}</span>
            <RemoveButton
              onClick={() =>
                onChange({ ...section, cards: section.cards.filter((_, idx) => idx !== i) })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Icon">
              <IconSelect value={card.icon} onChange={(icon) => setCard(i, { icon })} />
            </Field>
            <Field label="Title" required>
              <Input
                className={inputCls}
                value={card.title}
                placeholder="Card title"
                onChange={(e) => setCard(i, { title: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Points">
            <StringListEditor
              items={card.points}
              onChange={(points) => setCard(i, { points })}
              placeholder="Bullet point"
              addLabel="Add point"
            />
          </Field>
        </div>
      ))}
      <AddButton
        onClick={() =>
          onChange({
            ...section,
            cards: [...section.cards, { icon: "Globe", title: "", points: [""] }],
          })
        }
        label="Add card"
      />
    </div>
  );
}

function ChipsEditor({
  section,
  onChange,
}: {
  section: ChipsSection;
  onChange: (s: ChipsSection) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      <Field label="Chip icon">
        <IconSelect
          value={section.chipIcon}
          onChange={(chipIcon) => onChange({ ...section, chipIcon })}
        />
      </Field>
      <Field label="Chips" required>
        <StringListEditor
          items={section.chips}
          onChange={(chips) => onChange({ ...section, chips })}
          placeholder="e.g. Europe"
          addLabel="Add chip"
        />
      </Field>
      <Field label="Note (optional)">
        <Input
          className={inputCls}
          value={section.note ?? ""}
          placeholder="Small note under the chips"
          onChange={(e) => onChange({ ...section, note: e.target.value })}
        />
      </Field>
    </div>
  );
}

function StepsEditor({
  section,
  onChange,
}: {
  section: StepsSection;
  onChange: (s: StepsSection) => void;
}) {
  const setStep = (i: number, patch: Partial<(typeof section.steps)[number]>) =>
    onChange({
      ...section,
      steps: section.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      {section.steps.length === 0 && <div className={emptyStateCls}>No steps yet</div>}
      {section.steps.map((step, i) => (
        <div key={i} className={`${cardWrapCls} space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground-light">Step {i + 1}</span>
            <RemoveButton
              onClick={() =>
                onChange({ ...section, steps: section.steps.filter((_, idx) => idx !== i) })
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Field label="Title" required>
                <Input
                  className={inputCls}
                  value={step.title}
                  placeholder="Step title"
                  onChange={(e) => setStep(i, { title: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Day / tag (optional)">
              <Input
                className={inputCls}
                value={step.day ?? ""}
                placeholder="e.g. Day 2–4"
                onChange={(e) => setStep(i, { day: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Text" required>
            <textarea
              rows={2}
              className={textareaCls}
              value={step.text}
              placeholder="What happens in this step"
              onChange={(e) => setStep(i, { text: e.target.value })}
            />
          </Field>
          <Field label="Detail bullets (optional)">
            <StringListEditor
              items={step.details ?? []}
              onChange={(details) => setStep(i, { details })}
              placeholder="Detail bullet"
              addLabel="Add detail"
            />
          </Field>
          <Field label="Note (optional)">
            <Input
              className={inputCls}
              value={step.note ?? ""}
              placeholder="e.g. You receive: pickup receipt + tracking ID"
              onChange={(e) => setStep(i, { note: e.target.value })}
            />
          </Field>
        </div>
      ))}
      <AddButton
        onClick={() =>
          onChange({ ...section, steps: [...section.steps, { title: "", text: "" }] })
        }
        label="Add step"
      />
    </div>
  );
}

function ChecklistEditor({
  section,
  onChange,
}: {
  section: ChecklistSection;
  onChange: (s: ChecklistSection) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      <Field label="Items" required>
        <StringListEditor
          items={section.items}
          onChange={(items) => onChange({ ...section, items })}
          placeholder="e.g. Transparent communication"
          addLabel="Add item"
        />
      </Field>
    </div>
  );
}

function FaqEditor({
  section,
  onChange,
}: {
  section: FaqSection;
  onChange: (s: FaqSection) => void;
}) {
  const setFaq = (i: number, patch: Partial<(typeof section.faqs)[number]>) =>
    onChange({
      ...section,
      faqs: section.faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    });
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      {section.faqs.length === 0 && <div className={emptyStateCls}>No FAQs yet</div>}
      {section.faqs.map((faq, i) => (
        <div key={i} className={`${cardWrapCls} space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground-light">FAQ {i + 1}</span>
            <RemoveButton
              onClick={() =>
                onChange({ ...section, faqs: section.faqs.filter((_, idx) => idx !== i) })
              }
            />
          </div>
          <Field label="Question" required>
            <Input
              className={inputCls}
              value={faq.q}
              placeholder="Question"
              onChange={(e) => setFaq(i, { q: e.target.value })}
            />
          </Field>
          <Field label="Answer" required>
            <textarea
              rows={3}
              className={textareaCls}
              value={faq.a}
              placeholder="Answer"
              onChange={(e) => setFaq(i, { a: e.target.value })}
            />
          </Field>
        </div>
      ))}
      <AddButton
        onClick={() => onChange({ ...section, faqs: [...section.faqs, { q: "", a: "" }] })}
        label="Add FAQ"
      />
    </div>
  );
}

function TableEditor({
  section,
  onChange,
}: {
  section: TableSection;
  onChange: (s: TableSection) => void;
}) {
  const colCount = Math.max(section.columns.length, 1);
  const setCell = (r: number, c: number, v: string) =>
    onChange({
      ...section,
      rows: section.rows.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row
      ),
    });
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      <Field label="Columns" required>
        <StringListEditor
          items={section.columns}
          onChange={(columns) =>
            onChange({
              ...section,
              columns,
              // keep every row's cell count in sync with the column count
              rows: section.rows.map((row) =>
                Array.from({ length: Math.max(columns.length, 1) }, (_, i) => row[i] ?? "")
              ),
            })
          }
          placeholder="Column heading"
          addLabel="Add column"
        />
      </Field>
      <Field label="Rows">
        <div className="space-y-2">
          {section.rows.map((row, r) => (
            <div key={r} className="flex items-start gap-2">
              <div
                className="grid gap-2 flex-1"
                style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: colCount }, (_, c) => (
                  <Input
                    key={c}
                    className={inputCls}
                    value={row[c] ?? ""}
                    placeholder={section.columns[c] || `Col ${c + 1}`}
                    onChange={(e) => setCell(r, c, e.target.value)}
                  />
                ))}
              </div>
              <RemoveButton
                onClick={() =>
                  onChange({ ...section, rows: section.rows.filter((_, idx) => idx !== r) })
                }
              />
            </div>
          ))}
          <AddButton
            onClick={() =>
              onChange({ ...section, rows: [...section.rows, Array(colCount).fill("")] })
            }
            label="Add row"
          />
        </div>
      </Field>
    </div>
  );
}

function NotesEditor({
  section,
  onChange,
}: {
  section: NotesSection;
  onChange: (s: NotesSection) => void;
}) {
  const setNote = (i: number, patch: Partial<(typeof section.notes)[number]>) =>
    onChange({
      ...section,
      notes: section.notes.map((n, idx) => (idx === i ? { ...n, ...patch } : n)),
    });
  return (
    <div className="space-y-4">
      <OptionalIntroField
        value={section.intro}
        onChange={(intro) => onChange({ ...section, intro })}
      />
      {section.notes.length === 0 && <div className={emptyStateCls}>No notes yet</div>}
      {section.notes.map((note, i) => (
        <div key={i} className={`${cardWrapCls} space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground-light">Note {i + 1}</span>
            <RemoveButton
              onClick={() =>
                onChange({ ...section, notes: section.notes.filter((_, idx) => idx !== i) })
              }
            />
          </div>
          <Field label="Title" required>
            <Input
              className={inputCls}
              value={note.title}
              placeholder="Note title"
              onChange={(e) => setNote(i, { title: e.target.value })}
            />
          </Field>
          <Field label="Body" required>
            <textarea
              rows={3}
              className={textareaCls}
              value={note.body}
              placeholder="Note body"
              onChange={(e) => setNote(i, { body: e.target.value })}
            />
          </Field>
        </div>
      ))}
      <AddButton
        onClick={() =>
          onChange({ ...section, notes: [...section.notes, { title: "", body: "" }] })
        }
        label="Add note"
      />
    </div>
  );
}

function SectionBodyEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (s: Section) => void;
}) {
  switch (section.kind) {
    case "intro":
      return <IntroEditor section={section} onChange={onChange} />;
    case "cards":
      return <CardsEditor section={section} onChange={onChange} />;
    case "chips":
      return <ChipsEditor section={section} onChange={onChange} />;
    case "steps":
      return <StepsEditor section={section} onChange={onChange} />;
    case "checklist":
      return <ChecklistEditor section={section} onChange={onChange} />;
    case "faq":
      return <FaqEditor section={section} onChange={onChange} />;
    case "table":
      return <TableEditor section={section} onChange={onChange} />;
    case "notes":
      return <NotesEditor section={section} onChange={onChange} />;
  }
}

// ─── Normalization / cleanup ──────────────────────────────────────────────────

/** Merge a fetched content document with defaults so missing keys never crash the form. */
export function normalizeContent(raw: unknown): ServicePageContent {
  const empty = emptyServicePageContent();
  if (!raw || typeof raw !== "object") return empty;
  const c = raw as Partial<ServicePageContent>;
  return {
    ...empty,
    ...c,
    breadcrumb: Array.isArray(c.breadcrumb) && c.breadcrumb.length ? c.breadcrumb : empty.breadcrumb,
    chips: Array.isArray(c.chips) ? c.chips : [],
    formCountries: Array.isArray(c.formCountries) ? c.formCountries : [],
    sections: Array.isArray(c.sections)
      ? c.sections.filter((s): s is Section => !!s && typeof s === "object" && "kind" in s)
      : [],
  };
}

const trimList = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

/** Drop empty list entries / blank optional fields before saving. */
function cleanContent(content: ServicePageContent): ServicePageContent {
  return {
    ...content,
    breadcrumb: content.breadcrumb.filter((b) => b.label.trim()),
    chips: content.chips.filter((c) => c.title.trim() || c.sub.trim()),
    formCountries: trimList(content.formCountries ?? []),
    formCountryLabel: content.formCountryLabel?.trim() || undefined,
    helpPhone: content.helpPhone?.trim() || undefined,
    sections: content.sections.map((section) => {
      const intro =
        "intro" in section ? { intro: section.intro?.trim() || undefined } : {};
      switch (section.kind) {
        case "intro":
          return {
            ...section,
            paragraphs: trimList(section.paragraphs),
            stats: (section.stats ?? []).filter((s) => s.value.trim() || s.label.trim()),
          };
        case "cards":
          return {
            ...section,
            ...intro,
            cards: section.cards
              .filter((c) => c.title.trim())
              .map((c) => ({ ...c, points: trimList(c.points) })),
          };
        case "chips":
          return {
            ...section,
            ...intro,
            chips: trimList(section.chips),
            note: section.note?.trim() || undefined,
          };
        case "steps":
          return {
            ...section,
            ...intro,
            steps: section.steps
              .filter((s) => s.title.trim() || s.text.trim())
              .map((s) => ({
                ...s,
                day: s.day?.trim() || undefined,
                note: s.note?.trim() || undefined,
                details: s.details && trimList(s.details).length ? trimList(s.details) : undefined,
              })),
          };
        case "checklist":
          return { ...section, ...intro, items: trimList(section.items) };
        case "faq":
          return {
            ...section,
            ...intro,
            faqs: section.faqs.filter((f) => f.q.trim() && f.a.trim()),
          };
        case "table":
          return {
            ...section,
            ...intro,
            columns: trimList(section.columns),
            rows: section.rows.filter((r) => r.some((cell) => cell.trim())),
          };
        case "notes":
          return {
            ...section,
            ...intro,
            notes: section.notes.filter((n) => n.title.trim() || n.body.trim()),
          };
      }
    }),
  };
}

// ─── Main form ────────────────────────────────────────────────────────────────

export type ServicePageFormData = {
  slug: string;
  template: string;
  metaTitle: string;
  metaDescription: string;
  content: ServicePageContent;
};

export function emptyFormData(): ServicePageFormData {
  return {
    slug: "",
    template: "division",
    metaTitle: "",
    metaDescription: "",
    content: emptyServicePageContent(),
  };
}

/** Final slug cleanup (used for auto-generation and on submit). */
const generateSlug = (t: string) =>
  t
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Lenient sanitizer for manual typing: lowercases and drops invalid chars but
 * KEEPS trailing "-" so the user can type dashes naturally. Fully cleaned by
 * generateSlug() on submit.
 */
const typeSlug = (t: string) =>
  t
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");

export default function ServicePageForm({
  mode,
  initialData,
  originalSlug,
}: {
  mode: "create" | "update";
  initialData?: ServicePageFormData;
  originalSlug?: string;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<ServicePageFormData>(
    initialData ?? emptyFormData()
  );
  const [loading, setLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(mode === "create");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    meta: true,
    hero: true,
  });
  const [openArticleSections, setOpenArticleSections] = useState<Record<number, boolean>>({});
  const [newSectionKind, setNewSectionKind] = useState<SectionKind>("cards");

  const toggle = (key: string) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const content = formData.content;
  const setContent = (patch: Partial<ServicePageContent>) =>
    setFormData((p) => ({ ...p, content: { ...p.content, ...patch } }));

  // ── Template picker (create mode) ─────────────────────────────────────────

  const applyTemplate = (key: string) => {
    const tpl = SERVICE_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    setFormData({
      slug: tpl.slug,
      template: "division",
      metaTitle: tpl.metaTitle,
      metaDescription: tpl.metaDescription,
      content: structuredClone(tpl.content),
    });
    setAutoGenerateSlug(!tpl.slug);
    toast.success(`Loaded "${tpl.name}" template`, { closeButton: true });
  };

  // ── Hero helpers ──────────────────────────────────────────────────────────

  // Slug auto-generates from the hero title (lead + accent) while the
  // "Auto-generate" toggle is on; the slug input stays locked in that mode.
  const updateTitle = (field: "titleLead" | "titleAccent", value: string) =>
    setFormData((p) => {
      const nextContent = { ...p.content, [field]: value };
      return {
        ...p,
        slug: autoGenerateSlug
          ? generateSlug(`${nextContent.titleLead} ${nextContent.titleAccent}`)
          : p.slug,
        content: nextContent,
      };
    });

  const setBreadcrumb = (i: number, patch: Partial<{ label: string; href: string }>) =>
    setContent({
      breadcrumb: content.breadcrumb.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    });

  const setChip = (i: number, patch: Partial<(typeof content.chips)[number]>) =>
    setContent({
      chips: content.chips.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    });

  // ── Article section helpers ───────────────────────────────────────────────

  const updateSection = (i: number, s: Section) =>
    setContent({ sections: content.sections.map((sec, idx) => (idx === i ? s : sec)) });

  const removeSection = (i: number) =>
    setContent({ sections: content.sections.filter((_, idx) => idx !== i) });

  const moveSection = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= content.sections.length) return;
    const sections = [...content.sections];
    [sections[i], sections[target]] = [sections[target], sections[i]];
    setContent({ sections });
  };

  const addSection = () => {
    setContent({ sections: [...content.sections, createSection(newSectionKind)] });
    setOpenArticleSections((p) => ({ ...p, [content.sections.length]: true }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (status: "draft" | "published") => {
    const cleanSlug = generateSlug(formData.slug);
    if (!cleanSlug) {
      toast.error("Please enter a slug", { closeButton: true });
      return;
    }
    if (!content.badge.trim() || !content.titleAccent.trim()) {
      toast.error("Please fill the hero badge and title accent", { closeButton: true });
      return;
    }
    const badSection = content.sections.find((s) => !s.id.trim() || !s.label.trim());
    if (badSection) {
      toast.error("Every section needs an anchor id and a TOC label", { closeButton: true });
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
        template: formData.template || "division",
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        content: cleanContent(content),
        status,
      };

      const url =
        mode === "create" ? "/api/services" : `/api/services/${originalSlug}`;
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
        setTimeout(() => router.push("/dashboard/services"), 1000);
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

  const card = "rounded-lg border bg-card overflow-hidden";

  return (
    <div className="space-y-4">
      {mode === "create" && (
        <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
          <div className="flex items-center gap-2 text-foreground">
            <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Start from a template:</span>
          </div>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && applyTemplate(e.target.value)}
            className={`${selectCls} flex-1 max-w-sm`}
          >
            <option value="" disabled>
              Choose a template…
            </option>
            {SERVICE_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name} — {t.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── SEO / Meta ─────────────────────────────────────────────────────── */}
      <Collapsible.Root open={openSections.meta} onOpenChange={() => toggle("meta")}>
        <div className={card}>
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground">SEO / Meta</span>
              </div>
              {openSections.meta ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-4 pt-2 sm:p-6 sm:pt-2 space-y-4 border-t border-border">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>
                    Slug <span className="text-destructive">*</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateSlug}
                      onChange={(e) => {
                        const auto = e.target.checked;
                        setAutoGenerateSlug(auto);
                        if (auto)
                          setFormData((p) => ({
                            ...p,
                            slug: generateSlug(`${p.content.titleLead} ${p.content.titleAccent}`),
                          }));
                      }}
                      className="accent-brand"
                    />
                    Auto-generate from title (lead + accent)
                  </label>
                </div>
                <Input
                  className={`${inputCls} ${autoGenerateSlug ? "opacity-60 cursor-not-allowed" : ""}`}
                  value={formData.slug}
                  placeholder="explore-the-world-with-complete-confidence"
                  disabled={autoGenerateSlug}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, slug: typeSlug(e.target.value) }))
                  }
                />
                {autoGenerateSlug && (
                  <p className="text-xs text-muted-foreground">
                    Locked — generated from the hero title. Untick to edit manually (dashes allowed).
                  </p>
                )}
              </div>
              <Field label="Meta Title">
                <Input
                  className={inputCls}
                  value={formData.metaTitle}
                  placeholder="Travel & Tourism — JMT"
                  onChange={(e) => setFormData((p) => ({ ...p, metaTitle: e.target.value }))}
                />
              </Field>
              <Field label="Meta Description">
                <textarea
                  rows={3}
                  className={textareaCls}
                  value={formData.metaDescription}
                  placeholder="Shown in search results…"
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, metaDescription: e.target.value }))
                  }
                />
              </Field>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <Collapsible.Root open={openSections.hero} onOpenChange={() => toggle("hero")}>
        <div className={card}>
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground">Hero & Enquiry Form</span>
              </div>
              {openSections.hero ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-4 pt-2 sm:p-6 sm:pt-2 space-y-4 border-t border-border">
              <Field label="Breadcrumb">
                <div className="space-y-2">
                  {content.breadcrumb.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <Input
                          className={inputCls}
                          value={b.label}
                          placeholder="Label (e.g. Home)"
                          onChange={(e) => setBreadcrumb(i, { label: e.target.value })}
                        />
                        <Input
                          className={inputCls}
                          value={b.href ?? ""}
                          placeholder="Link (empty = current page)"
                          onChange={(e) => setBreadcrumb(i, { href: e.target.value })}
                        />
                      </div>
                      <RemoveButton
                        onClick={() =>
                          setContent({
                            breadcrumb: content.breadcrumb.filter((_, idx) => idx !== i),
                          })
                        }
                      />
                    </div>
                  ))}
                  <AddButton
                    onClick={() =>
                      setContent({ breadcrumb: [...content.breadcrumb, { label: "" }] })
                    }
                    label="Add breadcrumb"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Badge" required>
                  <Input
                    className={inputCls}
                    value={content.badge}
                    placeholder="TRAVEL & TOURISM"
                    onChange={(e) => setContent({ badge: e.target.value })}
                  />
                </Field>
                <Field label="Badge icon">
                  <IconSelect
                    value={content.badgeIcon}
                    onChange={(badgeIcon) => setContent({ badgeIcon })}
                  />
                </Field>
                <Field label="Title lead">
                  <Input
                    className={inputCls}
                    value={content.titleLead}
                    placeholder="Explore the world with"
                    onChange={(e) => updateTitle("titleLead", e.target.value)}
                  />
                </Field>
                <Field label="Title accent (highlighted part)" required>
                  <Input
                    className={inputCls}
                    value={content.titleAccent}
                    placeholder="complete confidence"
                    onChange={(e) => updateTitle("titleAccent", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Subtitle">
                <textarea
                  rows={3}
                  className={textareaCls}
                  value={content.subtitle}
                  placeholder="One-paragraph pitch under the title"
                  onChange={(e) => setContent({ subtitle: e.target.value })}
                />
              </Field>

              <Field label="Hero chips">
                <div className="space-y-2">
                  {content.chips.map((chip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <IconSelect value={chip.icon} onChange={(icon) => setChip(i, { icon })} />
                        <Input
                          className={inputCls}
                          value={chip.title}
                          placeholder="Title (e.g. 120+)"
                          onChange={(e) => setChip(i, { title: e.target.value })}
                        />
                        <Input
                          className={inputCls}
                          value={chip.sub}
                          placeholder="Subtext"
                          onChange={(e) => setChip(i, { sub: e.target.value })}
                        />
                      </div>
                      <RemoveButton
                        onClick={() =>
                          setContent({ chips: content.chips.filter((_, idx) => idx !== i) })
                        }
                      />
                    </div>
                  ))}
                  <AddButton
                    onClick={() =>
                      setContent({
                        chips: [...content.chips, { icon: "Globe", title: "", sub: "" }],
                      })
                    }
                    label="Add chip"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Form title">
                  <Input
                    className={inputCls}
                    value={content.formTitle}
                    placeholder="Plan your trip"
                    onChange={(e) => setContent({ formTitle: e.target.value })}
                  />
                </Field>
                <Field label="Form dropdown label">
                  <Input
                    className={inputCls}
                    value={content.formCountryLabel ?? ""}
                    placeholder="Preferred Region"
                    onChange={(e) => setContent({ formCountryLabel: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Form subtitle">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={content.formSubtitle}
                  placeholder="Share your details and our expert will call you back…"
                  onChange={(e) => setContent({ formSubtitle: e.target.value })}
                />
              </Field>
              <Field label="Form dropdown options">
                <StringListEditor
                  items={content.formCountries ?? []}
                  onChange={(formCountries) => setContent({ formCountries })}
                  placeholder="e.g. Europe"
                  addLabel="Add option"
                />
              </Field>
              <Field label="Help phone (optional)">
                <Input
                  className={inputCls}
                  value={content.helpPhone ?? ""}
                  placeholder="+91 98765 43210"
                  onChange={(e) => setContent({ helpPhone: e.target.value })}
                />
              </Field>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>

      {/* ── Article sections ───────────────────────────────────────────────── */}
      <div className={`${card} p-4 space-y-4`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ListPlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold text-foreground">Page Sections</span>
          <span className="text-xs text-muted-foreground">
            add, remove & reorder — each section appears in the page TOC
          </span>
        </div>

        {content.sections.length === 0 && (
          <div className={emptyStateCls}>
            No sections yet — pick a type below and click Add
          </div>
        )}

        {content.sections.map((section, i) => {
          const open = openArticleSections[i] ?? false;
          return (
            <Collapsible.Root
              key={i}
              open={open}
              onOpenChange={() => setOpenArticleSections((p) => ({ ...p, [i]: !open }))}
            >
              <div className="bg-muted/40 border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2">
                  <Collapsible.Trigger asChild>
                    <button className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80">
                      {open ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-foreground">
                        {i + 1}. {section.label || "(untitled section)"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand-link">
                        {section.kind}
                      </span>
                    </button>
                  </Collapsible.Trigger>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={i === 0}
                      onClick={() => moveSection(i, -1)}
                      title="Move up"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={i === content.sections.length - 1}
                      onClick={() => moveSection(i, 1)}
                      title="Move down"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <RemoveButton onClick={() => removeSection(i)} title="Remove section" />
                  </div>
                </div>
                <Collapsible.Content>
                  <div className="p-4 pt-2 space-y-4 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Anchor id" required>
                        <Input
                          className={inputCls}
                          value={section.id}
                          placeholder="e.g. overview"
                          onChange={(e) => updateSection(i, { ...section, id: e.target.value })}
                        />
                      </Field>
                      <Field label="TOC label" required>
                        <Input
                          className={inputCls}
                          value={section.label}
                          placeholder="e.g. Overview"
                          onChange={(e) =>
                            updateSection(i, { ...section, label: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Heading">
                        <Input
                          className={inputCls}
                          value={section.heading}
                          placeholder="Section heading"
                          onChange={(e) =>
                            updateSection(i, { ...section, heading: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <SectionBodyEditor section={section} onChange={(s) => updateSection(i, s)} />
                  </div>
                </Collapsible.Content>
              </div>
            </Collapsible.Root>
          );
        })}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <select
            value={newSectionKind}
            onChange={(e) => setNewSectionKind(e.target.value as SectionKind)}
            className={`${selectCls} flex-1 max-w-sm`}
          >
            {(Object.keys(SECTION_KIND_LABELS) as SectionKind[]).map((k) => (
              <option key={k} value={k}>
                {SECTION_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <AddButton onClick={addSection} label="Add section" />
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pb-10">
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
        >
          {mode === "create" ? "Publish Page" : "Update & Publish"}
        </Button>
      </div>
    </div>
  );
}
