"use client";

// Small form building blocks for the Homepage editor, styled like the other
// dashboard editors (About, Services): dark slate inputs, collapsible cards.

import { useId, type ReactNode } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomeLinkValue } from "@/app/lib/content/home-content";

export const inputCls =
  "w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
export const textareaCls = `${inputCls} resize-y`;
export const selectCls =
  "w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
export const itemCardCls = "rounded-lg border bg-muted/40 p-4 space-y-3";
const labelCls = "text-sm font-medium text-foreground";
const hintCls = "text-xs text-muted-foreground";
const addBtnCls = "text-foreground-light hover:text-foreground";
const iconBtnCls = "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={`block ${labelCls}`}>{label}</label>
      {children}
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea
          rows={rows}
          className={textareaCls}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputCls}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

const LINK_HINT = 'Section anchor (e.g. "#contact"), a path like "/about", or a full https:// URL.';

/** Label + link pair, e.g. a CTA button. */
export function LinkFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HomeLinkValue;
  onChange: (value: HomeLinkValue) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField label={`${label} text`} value={value.label} onChange={(v) => onChange({ ...value, label: v })} />
      <TextField
        label={`${label} link`}
        value={value.href}
        placeholder="#contact"
        hint={LINK_HINT}
        onChange={(v) => onChange({ ...value, href: v })}
      />
    </div>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-brand-link">{children}</h3>;
}

export function AddButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled} className={addBtnCls}>
      <Plus className="mr-1 h-4 w-4" /> {label}
    </Button>
  );
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Repeatable list of cards with reorder / remove controls.
 * `render` receives the item plus an `update(patch)` helper.
 */
export function ListEditor<T>({
  items,
  onChange,
  max,
  newItem,
  addLabel,
  itemLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  max: number;
  newItem: () => T;
  addLabel: string;
  itemLabel: (item: T, index: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const update = (index: number) => (patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className={itemCardCls}>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-foreground-light">{itemLabel(item, index)}</span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Move up"
                className={iconBtnCls}
                disabled={index === 0}
                onClick={() => onChange(move(items, index, index - 1))}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Move down"
                className={iconBtnCls}
                disabled={index === items.length - 1}
                onClick={() => onChange(move(items, index, index + 1))}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Remove"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {render(item, update(index), index)}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <AddButton
          onClick={() => onChange([...items, newItem()])}
          label={addLabel}
          disabled={items.length >= max}
        />
        <span className={hintCls}>
          {items.length} / {max}
        </span>
      </div>
    </div>
  );
}

/** List of plain strings (e.g. founder assurances). */
export function StringListEditor({
  items,
  onChange,
  max,
  addLabel,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  addLabel: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((it, i) => (i === index ? e.target.value : it)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Remove"
            className="h-8 w-8 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ""])} label={addLabel} disabled={items.length >= max} />
    </div>
  );
}

/** Pill switch used for "show this section on the homepage". */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-foreground-light">
      <span>{checked ? "Visible" : "Hidden"}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0 transition-colors ${checked ? "bg-brand" : "bg-muted-foreground/40"}`}
      >
        <span
          className={`absolute top-0.5 left-0 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

/** Collapsible section card; optional visibility switch in the header. */
export function SectionCard({
  icon: Icon,
  title,
  hint,
  open,
  onToggle,
  enabled,
  onEnabledChange,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children: ReactNode;
}) {
  const hidden = enabled === false;
  return (
    <Collapsible.Root open={open} onOpenChange={onToggle}>
      <div
        className={`overflow-hidden rounded-lg border bg-card ${
          hidden ? "border-border opacity-70" : "border-border"
        }`}
      >
        <div className="flex items-center gap-3 pr-4 hover:bg-muted/50">
          <Collapsible.Trigger asChild>
            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left">
              {open ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-lg font-semibold text-foreground">{title}</span>
                {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
              </div>
            </button>
          </Collapsible.Trigger>
          {onEnabledChange && enabled !== undefined && (
            <Toggle checked={enabled} onChange={onEnabledChange} label={`Show ${title} section`} />
          )}
        </div>
        <Collapsible.Content>
          <div className="space-y-4 border-t border-border p-4 sm:px-6 sm:pb-6">{children}</div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}
