"use client";

// Navbar and footer menu editors for Dashboard → Menus (app/dashboard/site-menus).
// Each entry is shown as a Heading (label only), a picked page (title + path,
// rename, "Change") or a Custom link (label + URL). Two levels, as the website
// renders them: navbar item → dropdown links, footer column → links. Hints
// under each entry say what the website will actually do with it.

import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowRight, ChevronDown, Link2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HOME_LIMITS, isSafeHref, type HomeLinkValue, type HomeNavValue } from "@/app/lib/content/home-content";
import { inputCls } from "./fields";
import type { SectionEditorProps } from "./types";

/** A page or section the website has — offered by "Change" / "Pick a page". */
export interface LinkOption {
  href: string;
  label: string;
}

/** Id of the <datalist> rendered by <LinkOptionsList>; custom link inputs point at it. */
const LINK_OPTIONS_ID = "site-link-options";

/** Suggestions for every custom link input on the page (render once). */
export function LinkOptionsList({ options }: { options: LinkOption[] }) {
  return (
    <datalist id={LINK_OPTIONS_ID}>
      {options.map((o) => (
        <option key={o.href} value={o.href}>
          {o.label}
        </option>
      ))}
    </datalist>
  );
}

/** True for a path on this website ("/x") that is not one of its pages — a 404. */
function isMissingPage(href: string, options: LinkOption[]): boolean {
  const value = href.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  const path = value.split(/[?#]/)[0].replace(/(.)\/+$/, "$1") || "/";
  return !options.some((o) => o.href === path);
}

// jmt-frontend/lib/siteLinks.ts (mapLink) re-points navbar/footer links whose
// link is empty or a "#section" by their label. Keep this copy in sync.
const LABEL_TARGETS: [string[], string][] = [
  [["contact", "contact us"], "/contact"],
  [["about"], "/about"],
  [["join our crew"], "/join-our-crew"],
  [["site labour supply"], "/service/site-service-supply"],
];

/** Where a link really goes on the website; null = no link. */
function websiteHref(label: string, href: string): string | null {
  const h = href.trim();
  const value = h && h !== "#" ? h : null;
  if (value && !value.startsWith("#")) return value;
  const name = label.trim().toLowerCase();
  const target = LABEL_TARGETS.find(([names]) => names.includes(name));
  if (target) return target[1];
  if (!value) return null;
  return value === "#contact" ? value : `/${value}`; // "#x" works from every page as "/#x"
}

const moveIn = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

let idSeq = 0;
const newId = () => `r${++idSeq}`;

/**
 * Stable React keys for a list edited here, so per-row state (open child menu,
 * entry mode, rename) moves with the row. Every add/move/remove goes through it.
 */
function useRowIds<T>(items: T[], onChange: (items: T[]) => void) {
  const [ids, setIds] = useState<string[]>(() => items.map(newId));
  const keys = items.map((_, i) => ids[i] ?? `row-${i}`);
  return {
    keys,
    add: (item: T) => {
      setIds([...keys, newId()]);
      onChange([...items, item]);
    },
    move: (from: number, to: number) => {
      setIds(moveIn(keys, from, to));
      onChange(moveIn(items, from, to));
    },
    remove: (index: number) => {
      setIds(keys.filter((_, i) => i !== index));
      onChange(items.filter((_, i) => i !== index));
    },
  };
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function MoveButtons({ index, count, onMove, name }: { index: number; count: number; onMove: (to: number) => void; name: string }) {
  const cls = "h-8 w-8 p-0 text-muted-foreground hover:text-foreground";
  return (
    <div className="flex items-center">
      <Button type="button" variant="ghost" size="sm" className={cls} disabled={index === 0} onClick={() => onMove(index - 1)} title="Move up" aria-label={`Move ${name} up`}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={cls} disabled={index === count - 1} onClick={() => onMove(index + 1)} title="Move down" aria-label={`Move ${name} down`}>
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

function DeleteButton({ onClick, name }: { onClick: () => void; name: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title="Delete"
      aria-label={`Delete ${name}`}
      className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

/** Dropdown of the website's pages; `trigger` is the button that opens it. */
function PagePicker({ options, current, onPick, trigger }: { options?: LinkOption[]; current: string; onPick: (o: LinkOption) => void; trigger: ReactNode }) {
  if (!options) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
        {options.map((o) => (
          <DropdownMenuItem key={o.href} onSelect={() => onPick(o)} className={o.href === current ? "bg-accent" : undefined}>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{o.label}</span>
              <span className="block truncate font-mono text-xs text-muted-foreground">{o.href}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const textLinkCls = "h-7 px-2 text-xs text-brand-link";

function Note({ warn, children }: { warn?: boolean; children: ReactNode }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs ${warn ? "text-warning" : "text-muted-foreground"}`}>
      {warn ? <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> : <ArrowRight className="mt-px h-3 w-3 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

/** Which list an entry is in — the website treats each a little differently. */
type Place = "nav" | "navChild" | "footerLink";

/** What the website will do with this entry, as notes under it; null when there is nothing to say. */
function entryNotes(value: HomeLinkValue, place: Place, hasDropdown: boolean, options?: LinkOption[]): ReactNode {
  const href = value.href.trim();
  if (href && !isSafeHref(href)) {
    return (
      <Note warn>
        The website can&apos;t use this link: start it with / (a page here), # (a homepage section), https://, mailto: or tel:.
        Saving is blocked until it is fixed.
      </Note>
    );
  }
  const notes: ReactNode[] = [];
  const dest = websiteHref(value.label, href);
  // Re-pointed because of its label (e.g. "About" → /about), not just "#x" → "/#x".
  const relabelled = dest !== null && dest !== websiteHref("", href);

  if (!value.label.trim()) notes.push(<Note key="label" warn>No label — the website does not show this entry.</Note>);
  if (relabelled) {
    notes.push(
      <Note key="dest">
        On the website this opens <span className="font-mono">{dest}</span> — the label “{value.label.trim()}” is linked to that page.
      </Note>,
    );
  }
  if (dest && options && isMissingPage(dest, options)) {
    notes.push(<Note key="404" warn>The website has no page here — visitors and search engines would get a 404.</Note>);
  }
  if (place === "nav") {
    if (dest === "/contact") {
      notes.push(<Note key="contact" warn>Hidden in the navbar: the orange Contact button already opens /contact.</Note>);
    } else if (!hasDropdown && !dest) {
      notes.push(<Note key="empty" warn>Hidden on desktop: give it a link or add child links (phones show it as plain text).</Note>);
    } else if (hasDropdown && dest) {
      notes.push(<Note key="dd">On desktop this item opens its dropdown; its own link works in the phone menu only.</Note>);
    }
  }
  if (place === "navChild" && !dest && value.label.trim()) {
    notes.push(<Note key="nolink" warn>No link — this entry is not shown in the dropdown.</Note>);
  }
  if (place === "footerLink" && !dest && value.label.trim()) {
    notes.push(<Note key="text">No link — shown as plain text.</Note>);
  }
  return notes.length ? <div className="space-y-0.5">{notes}</div> : null;
}

type Mode = "heading" | "page" | "custom";

/**
 * One menu entry. Starts as a picked page when its link is one of the website's
 * pages, a heading when it may be one (main navbar items) and has no link,
 * otherwise as a custom link; the buttons switch between them. Once the editor
 * types in a custom link it stays one.
 */
function MenuEntry({
  value,
  onChange,
  options,
  place,
  hasDropdown = false,
}: {
  value: HomeLinkValue;
  onChange: (value: HomeLinkValue) => void;
  options?: LinkOption[];
  place: Place;
  hasDropdown?: boolean;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [renaming, setRenaming] = useState(false);
  const allowHeading = place === "nav";
  const small = place !== "nav";
  const href = value.href.trim();
  const page = options?.find((o) => o.href === href);
  const derived: Mode = page ? "page" : allowHeading && (href === "" || href === "#") ? "heading" : "custom";
  const current = mode === "page" && !page ? "custom" : (mode ?? derived);
  const inputSize = small ? "h-9" : "h-10";
  const notes = entryNotes(value, place, hasDropdown, options);

  // Keep a label the editor typed; take the page's name if blank or still the old page's name.
  const pick = (o: LinkOption) => {
    const keep = value.label.trim() !== "" && value.label !== page?.label;
    onChange({ label: keep ? value.label : o.label, href: o.href });
    setMode("page");
  };

  if (current === "page") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <input
                autoFocus
                className={`${inputCls} h-8`}
                value={value.label}
                placeholder={page?.label}
                onChange={(e) => onChange({ ...value, label: e.target.value })}
                onBlur={() => setRenaming(false)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === "Escape") && setRenaming(false)}
              />
            ) : (
              <p className={`truncate font-medium text-foreground ${small ? "text-xs" : "text-sm"}`}>
                {value.label || <span className="text-muted-foreground">No label</span>}
              </p>
            )}
            <p className="flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
              <Link2 className="h-3 w-3 shrink-0" />
              {value.href}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Rename this entry in the menu" aria-label="Rename this entry in the menu" onClick={() => setRenaming((r) => !r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <PagePicker
            options={options}
            current={href}
            onPick={pick}
            trigger={
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                Change <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            }
          />
        </div>
        {notes}
        <Button type="button" variant="ghost" size="sm" className={textLinkCls} onClick={() => setMode("custom")}>
          <Link2 className="mr-1 h-3 w-3" /> Use a custom link instead
        </Button>
      </div>
    );
  }

  const pickTrigger = (text: string) => (
    <Button type="button" variant="ghost" size="sm" className={textLinkCls}>
      <Search className="mr-1 h-3 w-3" /> {text}
    </Button>
  );

  if (current === "heading") {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <label className="text-sm font-medium text-foreground">Heading — opens its children, goes nowhere on click</label>
          <div className="flex flex-wrap">
            <PagePicker options={options} current={href} onPick={pick} trigger={pickTrigger("Attach a page instead")} />
            <Button type="button" variant="ghost" size="sm" className={textLinkCls} onClick={() => setMode("custom")}>
              <Link2 className="mr-1 h-3 w-3" /> Use a custom link
            </Button>
          </div>
        </div>
        <input className={`${inputCls} ${inputSize}`} value={value.label} placeholder="e.g. Services" onChange={(e) => onChange({ ...value, label: e.target.value })} />
        {notes ?? <p className="text-xs text-muted-foreground">Add child items below — this is what the visitor opens to see them.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className={`font-medium text-foreground ${small ? "text-xs" : "text-sm"}`}>Custom link</label>
        <div className="flex flex-wrap">
          <PagePicker options={options} current={href} onPick={pick} trigger={pickTrigger("Pick a page instead")} />
          {allowHeading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={textLinkCls}
              onClick={() => {
                onChange({ ...value, href: "" });
                setMode("heading");
              }}
            >
              Make it a heading
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={`${inputCls} ${inputSize}`} value={value.label} placeholder="Label shown in the menu" onChange={(e) => onChange({ ...value, label: e.target.value })} />
        <input
          className={`${inputCls} ${inputSize} font-mono`}
          value={value.href}
          placeholder="https://… or /a-path"
          list={options ? LINK_OPTIONS_ID : undefined}
          onChange={(e) => {
            setMode("custom"); // keep this a custom link even when the text matches a page
            onChange({ ...value, href: e.target.value });
          }}
        />
      </div>
      {notes ?? <p className="text-xs text-muted-foreground">Nothing checks a custom link — a wrong path gives visitors a 404.</p>}
    </div>
  );
}

/** Indented child list with its own header and "Add" button. */
function ChildList({
  items,
  max,
  onChange,
  options,
  place,
  extra,
}: {
  items: HomeLinkValue[];
  max: number;
  onChange: (items: HomeLinkValue[]) => void;
  options?: LinkOption[];
  place: Place;
  extra?: ReactNode;
}) {
  const rows = useRowIds(items, onChange);
  return (
    <div className="ml-1 space-y-4 border-l-2 border-primary/30 pl-3 sm:ml-4 sm:pl-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground-light">
          Child Menu <span className="text-xs font-normal text-muted-foreground">{items.length} / {max}</span>
        </h3>
        <Button type="button" size="sm" className="h-8 text-xs" disabled={items.length >= max} onClick={() => rows.add({ label: "", href: "" })}>
          <Plus className="mr-1 h-3 w-3" /> Add Child
        </Button>
      </div>
      {extra}
      {items.map((child, i) => (
        <div key={rows.keys[i]} className="space-y-2 rounded-lg border bg-card p-3 sm:p-4">
          <MenuEntry value={child} onChange={(next) => onChange(items.map((c, j) => (j === i ? next : c)))} options={options} place={place} />
          <div className="flex items-center justify-end gap-1">
            <MoveButtons index={i} count={items.length} onMove={(to) => rows.move(i, to)} name={child.label || `link ${i + 1}`} />
            <DeleteButton onClick={() => rows.remove(i)} name={child.label || `link ${i + 1}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

const mainCardCls = "space-y-5 rounded-lg border bg-muted/40 p-3 sm:p-5";

type MenuProps = SectionEditorProps<"site"> & { options?: LinkOption[] };

// ── Navbar ───────────────────────────────────────────────────────────────────

/** Navbar menu items and their dropdowns. */
export function NavItemsEditor({ value, onChange, options }: MenuProps) {
  const nav = value.nav;
  const setNav = (next: HomeNavValue[]) => onChange({ ...value, nav: next });
  const updateItem = (i: number, patch: Partial<HomeNavValue>) => setNav(nav.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const rows = useRowIds(nav, setNav);
  /** Child menus opened with "Add Child Menu" before they have any links, by row key. */
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={nav.length >= HOME_LIMITS.nav}
          onClick={() => rows.add({ label: "", href: "", children: [], autoServices: false })}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Main Menu
        </Button>
      </div>
      {nav.map((item, i) => {
        const key = rows.keys[i];
        const name = item.label || `menu item ${i + 1}`;
        const hasChildren = item.children.length > 0 || item.autoServices || Boolean(opened[key]);
        // What the website shows as a dropdown: links with a label (and the auto-listed service pages).
        const hasDropdown = item.autoServices || item.children.some((c) => c.label.trim());
        return (
          <div key={key} className={mainCardCls}>
            <MenuEntry value={item} onChange={(link) => updateItem(i, link)} options={options} place="nav" hasDropdown={hasDropdown} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <MoveButtons index={i} count={nav.length} onMove={(to) => rows.move(i, to)} name={name} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  if (hasChildren) {
                    if (item.children.length && !window.confirm(`Remove the ${item.children.length} child link(s) of "${name}"?`)) return;
                    updateItem(i, { children: [], autoServices: false });
                    setOpened((o) => ({ ...o, [key]: false }));
                  } else {
                    setOpened((o) => ({ ...o, [key]: true }));
                  }
                }}
              >
                {hasChildren ? "Remove Child Menu" : "Add Child Menu"}
              </Button>
              <DeleteButton
                name={name}
                onClick={() => {
                  if (item.children.length && !window.confirm(`Delete "${name}" and its ${item.children.length} child link(s)?`)) return;
                  rows.remove(i);
                }}
              />
            </div>
            {hasChildren && (
              <ChildList
                items={item.children}
                max={HOME_LIMITS.navChildren}
                onChange={(children) => updateItem(i, { children })}
                options={options}
                place="navChild"
                extra={
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0"
                      checked={item.autoServices}
                      onChange={(e) => updateItem(i, { autoServices: e.target.checked })}
                    />
                    <span>
                      List published service pages in this dropdown
                      <span className="block text-xs text-muted-foreground">
                        Every page published under Dashboard → Services shows here automatically, before the links below; a
                        link with the same label as a service page is skipped.
                      </span>
                    </span>
                  </label>
                }
              />
            )}
          </div>
        );
      })}
      {nav.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No menu items. Click &quot;Add Main Menu&quot;.</p>}
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

/** Footer link columns: a heading each, with its links. */
export function FooterColumnsEditor({ value, onChange, options }: MenuProps) {
  const columns = value.footerColumns;
  const setColumns = (next: typeof columns) => onChange({ ...value, footerColumns: next });
  const updateColumn = (i: number, patch: Partial<(typeof columns)[number]>) =>
    setColumns(columns.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const rows = useRowIds(columns, setColumns);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={columns.length >= HOME_LIMITS.footerColumns} onClick={() => rows.add({ title: "", links: [] })}>
          <Plus className="mr-1 h-4 w-4" /> Add Main Menu
        </Button>
      </div>
      {columns.map((column, i) => {
        const name = column.title || `column ${i + 1}`;
        return (
          <div key={rows.keys[i]} className={mainCardCls}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Heading — the column title, goes nowhere on click</label>
              <input className={`${inputCls} h-10`} value={column.title} placeholder="e.g. Company" onChange={(e) => updateColumn(i, { title: e.target.value })} />
              {column.title.trim() ? (
                <p className="text-xs text-muted-foreground">Add the column&apos;s links below.</p>
              ) : (
                <Note warn>No title — the website does not show this column.</Note>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <MoveButtons index={i} count={columns.length} onMove={(to) => rows.move(i, to)} name={name} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={column.links.length === 0}
                onClick={() => {
                  if (!window.confirm(`Remove all ${column.links.length} link(s) of "${name}"?`)) return;
                  updateColumn(i, { links: [] });
                }}
              >
                Remove Child Menu
              </Button>
              <DeleteButton
                name={name}
                onClick={() => {
                  if (column.links.length && !window.confirm(`Delete "${name}" and its ${column.links.length} link(s)?`)) return;
                  rows.remove(i);
                }}
              />
            </div>
            <ChildList
              items={column.links}
              max={HOME_LIMITS.footerLinks}
              onChange={(links) => updateColumn(i, { links })}
              options={options}
              place="footerLink"
            />
          </div>
        );
      })}
      {columns.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No columns. Click &quot;Add Main Menu&quot;.</p>}
    </div>
  );
}
