"use client";

// Generic editor for the JMT site pages (About, Contact, Join our crew).
//
// The form is generated from the page's bundled content (the registry's
// `defaults`): one card per top-level section, and inside it one field per
// value — text inputs, "phone version" pairs, orange-accent headings, images
// (Media Library), icon dropdowns, switches and repeatable lists. Adding a
// field to the bundled copy in jmt-frontend/data (and its copy here) makes it
// editable with no change to this file.

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, FileText, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageField from "@/components/common/ImageField";
import {
  AddButton,
  Field,
  SectionCard,
  SubHeading,
  TextField,
  inputCls,
  itemCardCls,
  selectCls,
} from "@/components/homepage-editor/fields";
import type { HomeImageValue } from "@/app/lib/content/home-content";
import type { ImageFocus } from "@/types/homepage";
import {
  MAX_LIST_LENGTH,
  blankLike,
  isCopyValue,
  isImageValue,
  isPlainObject,
  patternOf,
  type PlainObject,
} from "@/lib/sitePages/mergeContent";
import type { SitePageDefinition } from "@/app/lib/content/site-pages";

type Path = (string | number)[];

// ── Labels ───────────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  meta: "SEO",
  title: "Title",
  description: "Description",
  text: "Text",
  short: "Phone version (optional)",
  desktop: "Desktop and tablet",
  mobile: "Phones",
  long: "Full",
  lead: "Heading start",
  accent: "Highlighted words (orange)",
  tail: "Heading end",
  eyebrow: "Eyebrow (small label above the heading)",
  intro: "Intro",
  introShort: "Intro on phones",
  pill: "Label pill",
  heading: "Heading",
  subtitle: "Subtitle",
  primaryCta: "Main button",
  secondaryCta: "Second button",
  whatsappCta: "WhatsApp button",
  cta: "Button",
  applyCta: "Apply button",
  crumbHome: "Breadcrumb: home link",
  crumb: "Breadcrumb: this page",
  live: "Live (off = “Coming soon”)",
  alt: "Alt text",
  src: "Image",
  icon: "Icon",
  copy: "Section heading",
  noFee: "No-fee notice",
  keepReady: "Keep ready",
  placeholders: "Placeholders",
  labels: "Labels",
  messages: "Messages",
  toAdd: "“To add” placeholder",
  whatsapp: "WhatsApp line",
  reassurance: "Reassurance line",
  honeypot: "Spam-trap label (screen readers)",
};

const ITEM_LABEL_KEYS = ["title", "name", "label", "text", "when", "value", "tag"];

function humanize(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (isPlainObject(value)) {
    for (const key of ITEM_LABEL_KEYS) {
      const text = textOf(value[key]);
      if (text) return text;
    }
    if (typeof value.lead === "string") return `${value.lead} ${value.accent ?? ""}`.trim();
  }
  return "";
}

function itemLabel(value: unknown, index: number): string {
  const text = textOf(value).trim();
  const short = text.length > 60 ? `${text.slice(0, 57)}…` : text;
  return short ? `${index + 1}. ${short}` : `Item ${index + 1}`;
}

// ── Immutable update ─────────────────────────────────────────────────────────

export function setIn(root: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy;
  }
  const obj = isPlainObject(root) ? root : {};
  return { ...obj, [head]: setIn(obj[head as string], rest, value) };
}

function getIn(root: unknown, path: Path): unknown {
  let node = root;
  for (const part of path) {
    if (Array.isArray(node)) node = node[part as number];
    else if (isPlainObject(node)) node = node[part as string];
    else return undefined;
  }
  return node;
}

// ── Shape helpers ────────────────────────────────────────────────────────────

const isAccentHeading = (v: unknown): v is PlainObject =>
  isPlainObject(v) && typeof v.lead === "string" && typeof v.accent === "string";

const isResponsivePair = (v: unknown): v is PlainObject =>
  isPlainObject(v) &&
  Object.keys(v).length === 2 &&
  ((typeof v.desktop === "string" && typeof v.mobile === "string") ||
    (typeof v.long === "string" && typeof v.short === "string"));

const multiline = (key: string, def: unknown) =>
  ["text", "intro", "subtitle", "description", "address"].includes(key) || (typeof def === "string" && def.length > 90);

/** Reads the natural size of an image URL (keeps next/image's aspect ratio right after a swap). */
function measureImage(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(img.naturalWidth ? { width: img.naturalWidth, height: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── Editor ───────────────────────────────────────────────────────────────────

interface Ctx {
  page: SitePageDefinition;
  root: PlainObject;
  onChange: (path: Path, value: unknown) => void;
}

interface NodeProps {
  ctx: Ctx;
  path: Path;
  name: string;
  value: unknown;
  def: unknown;
}

function isLocked(ctx: Ctx, path: Path) {
  return (ctx.page.locked ?? []).includes(patternOf(path));
}

/** A list whose items have locked fields keeps its length (items line up with fixed values). */
function isFixedList(ctx: Ctx, path: Path) {
  const prefix = `${patternOf(path)}[]`;
  return (ctx.page.locked ?? []).some((p) => p.startsWith(prefix));
}

function hintFor(ctx: Ctx, path: Path) {
  return ctx.page.hints?.[patternOf(path)];
}

function Node({ ctx, path, name, value, def }: NodeProps): ReactNode {
  if (isLocked(ctx, path)) return null;
  const set = (v: unknown) => ctx.onChange(path, v);
  const label = humanize(name);
  const hint = hintFor(ctx, path);

  // Dropdown (icons)
  const options = ctx.page.options?.[patternOf(path)];
  if (options && typeof def === "string") {
    const current = typeof value === "string" ? value : def;
    return (
      <Field label={label} hint={hint}>
        <select className={selectCls} value={current} onChange={(e) => set(e.target.value)}>
          {!options.includes(current) && <option value={current}>{current}</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o.startsWith("/") ? o.split("/").pop()?.replace(/\.\w+$/, "") : o}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (name === "introShort") {
    const mode = value === null ? "hidden" : value ? "custom" : "same";
    return (
      <Field label={label} hint="Phones can show a shorter intro, the same one, or none.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className={`${selectCls} sm:w-56`}
            value={mode}
            onChange={(e) =>
              set(
                e.target.value === "hidden"
                  ? null
                  : e.target.value === "same"
                    ? ""
                    : textOf(getIn(ctx.root, [...path.slice(0, -1), "intro"])),
              )
            }
          >
            <option value="same">Same as intro</option>
            <option value="custom">Shorter text</option>
            <option value="hidden">Not shown on phones</option>
          </select>
          {mode === "custom" && (
            <input
              className={inputCls}
              value={String(value)}
              placeholder="Empty = same as intro"
              onChange={(e) => set(e.target.value)}
            />
          )}
        </div>
      </Field>
    );
  }

  if (typeof def === "string" || def === null) {
    return (
      <TextField
        label={label}
        hint={hint}
        value={typeof value === "string" ? value : ""}
        multiline={multiline(name, def)}
        onChange={set}
      />
    );
  }

  if (typeof def === "number") {
    return (
      <Field label={label} hint={hint}>
        <input
          type="number"
          className={inputCls}
          value={typeof value === "number" ? value : def}
          onChange={(e) => set(Number(e.target.value) || 0)}
        />
      </Field>
    );
  }

  if (typeof def === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="checkbox" className="h-4 w-4" checked={value === true} onChange={(e) => set(e.target.checked)} />
        {name === "lead" ? "Highlight (brown dot)" : label}
      </label>
    );
  }

  if (isImageValue(def)) {
    const img = isImageValue(value) ? value : def;
    const imageValue: HomeImageValue = {
      src: img.src === def.src ? "" : String(img.src),
      alt: String(img.alt),
      focus: (typeof img.focus === "string" ? img.focus : "center") as ImageFocus,
    };
    return (
      <ImageField
        label={label}
        hint={hint}
        value={imageValue}
        defaultSrc={String(def.src)}
        onChange={async (next) => {
          const src = next.src || String(def.src);
          const base = { ...img, src, alt: next.alt, focus: next.focus };
          if (src === img.src) return set(base);
          if (src === def.src) return set({ ...base, width: def.width, height: def.height });
          set(base);
          const size = await measureImage(src);
          if (size) ctx.onChange(path, { ...base, ...size });
        }}
      />
    );
  }

  if (Array.isArray(def)) return <ListNode ctx={ctx} path={path} name={name} value={value} def={def} />;

  if (isPlainObject(def)) {
    const obj = isPlainObject(value) ? value : def;
    const keys = Object.keys(def);
    const child = (key: string) => (
      <Node key={key} ctx={ctx} path={[...path, key]} name={key} value={obj[key]} def={def[key]} />
    );

    // Compact layouts for the common small shapes.
    if (isCopyValue(def) || isResponsivePair(def)) {
      return (
        <Field label={label} hint={hint}>
          <div className="grid grid-cols-1 gap-3 rounded-md border border-border/60 p-3 sm:grid-cols-2">{keys.map(child)}</div>
        </Field>
      );
    }
    if (isAccentHeading(def)) {
      return (
        <Field label={label} hint={hint}>
          <div className="space-y-2 rounded-md border border-border/60 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{keys.map(child)}</div>
            <p className="text-xs text-muted-foreground">
              Preview: {String(obj.lead ?? "")} <span className="font-semibold text-orange-500">{String(obj.accent ?? "")}</span>
              {String(obj.tail ?? "")}
            </p>
          </div>
        </Field>
      );
    }

    return (
      <div className="space-y-3 rounded-md border border-border/60 p-3 sm:p-4">
        <SubHeading>{label}</SubHeading>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {keys.map(child)}
      </div>
    );
  }

  return null;
}

function ListNode({ ctx, path, name, value, def }: NodeProps & { def: unknown[] }) {
  const items = Array.isArray(value) ? value : def;
  const fixed = isFixedList(ctx, path);
  const hint = hintFor(ctx, path);
  const set = (next: unknown[]) => ctx.onChange(path, next);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set(next);
  };
  const template = def[0];
  const simple = typeof template === "string";

  const controls = (i: number) => (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="ghost" size="sm" title="Move up" className="h-8 w-8 p-0" disabled={i === 0} onClick={() => move(i, i - 1)}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" title="Move down" className="h-8 w-8 p-0" disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
        <ArrowDown className="h-4 w-4" />
      </Button>
      {!fixed && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Remove"
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => set(items.filter((_, j) => j !== i))}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <SubHeading>{humanize(name)}</SubHeading>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {items.map((item, i) =>
        simple ? (
          <div key={i} className="flex items-center gap-2">
            <input
              className={inputCls}
              value={typeof item === "string" ? item : ""}
              onChange={(e) => set(items.map((it, j) => (j === i ? e.target.value : it)))}
            />
            {controls(i)}
          </div>
        ) : (
          <div key={i} className={itemCardCls}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground-light">{itemLabel(item, i)}</span>
              {controls(i)}
            </div>
            {Array.isArray(template) ? (
              <ListNode ctx={ctx} path={[...path, i]} name={`Row ${i + 1}`} value={item} def={(def[i] ?? template) as unknown[]} />
            ) : isPlainObject(template) && !isImageValue(template) ? (
              Object.keys(template).map((key) => (
                <Node
                  key={key}
                  ctx={ctx}
                  path={[...path, i, key]}
                  name={key}
                  value={isPlainObject(item) ? item[key] : undefined}
                  def={((def[i] ?? template) as PlainObject)[key]}
                />
              ))
            ) : (
              <Node ctx={ctx} path={[...path, i]} name={`Item ${i + 1}`} value={item} def={def[i] ?? template} />
            )}
          </div>
        ),
      )}
      {!fixed && template !== undefined && (
        <div className="flex items-center gap-3">
          <AddButton
            label={`Add ${simple ? "line" : "item"}`}
            disabled={items.length >= MAX_LIST_LENGTH}
            onClick={() => set([...items, blankLike(template)])}
          />
          <span className="text-xs text-muted-foreground">{items.length} items</span>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ContentEditor({
  page,
  content,
  onChange,
  open,
  onToggle,
}: {
  page: SitePageDefinition;
  content: PlainObject;
  /** Receives an updater, so async edits (image size lookups) never overwrite newer ones. */
  onChange: (update: (prev: PlainObject) => PlainObject) => void;
  open: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const ctx: Ctx = {
    page,
    root: content,
    onChange: (path, value) => onChange((prev) => setIn(prev, path, value) as PlainObject),
  };
  const listed = Object.keys(page.sections).filter((k) => k in page.defaults);
  const keys = [...listed, ...Object.keys(page.defaults).filter((k) => !listed.includes(k))];

  return (
    <>
      {keys.map((key) => {
        const section = page.sections[key] ?? { title: humanize(key) };
        const def = page.defaults[key];
        const value = content[key];
        const fields = isPlainObject(def) && !isImageValue(def) && !isCopyValue(def) && !isAccentHeading(def)
          ? Object.keys(def).map((k) => (
              <Node key={k} ctx={ctx} path={[key, k]} name={k} value={isPlainObject(value) ? value[k] : undefined} def={def[k]} />
            ))
          : <Node ctx={ctx} path={[key]} name={key} value={value} def={def} />;
        return (
          <SectionCard
            key={key}
            icon={FileText}
            title={section.title}
            hint={section.hint}
            open={!!open[key]}
            onToggle={() => onToggle(key)}
          >
            {key === "meta" && (
              <p className="text-xs text-warning/80">
                Not shown on the page — browser tab title, Google results and link previews only.
              </p>
            )}
            {fields}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (window.confirm(`Reset “${section.title}” to the default copy? (Not saved until you click Save.)`)) {
                    ctx.onChange([key], structuredClone(def));
                  }
                }}
              >
                <RotateCcw className="mr-1 h-4 w-4" /> Reset section to default
              </Button>
            </div>
          </SectionCard>
        );
      })}
    </>
  );
}
