"use client";

import Link from "next/link";
import { HOME_LIMITS } from "@/app/lib/content/home-content";
import { Field, Grid, ListEditor, SubHeading, TextField, inputCls } from "./fields";
import { patcher, type SectionEditorProps } from "./types";
import type { HomeLinkValue } from "@/app/lib/content/home-content";

/** A page or section the website has — link suggestions on the Header/Footer Menu pages. */
export interface LinkOption {
  href: string;
  label: string;
}

/** Id of the <datalist> rendered by <LinkOptionsList>; link inputs point at it. */
const LINK_OPTIONS_ID = "site-link-options";

/** Suggestions for every link input on the page (render once). */
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

/** Link input; with `options` it suggests the website's pages and warns about links that 404. */
function LinkInput({
  value,
  onChange,
  options,
  placeholder = "#services or https://…",
}: {
  value: string;
  onChange: (value: string) => void;
  options?: LinkOption[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <input
        className={inputCls}
        placeholder={placeholder}
        value={value}
        list={options ? LINK_OPTIONS_ID : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {options && isMissingPage(value, options) && (
        <p className="text-xs text-warning">The website has no page here — visitors and search engines would get a 404.</p>
      )}
    </div>
  );
}

/** Compact label + link rows (dropdown children, footer links). */
function LinkRows({
  items,
  onChange,
  max,
  addLabel,
  options,
}: {
  items: HomeLinkValue[];
  onChange: (items: HomeLinkValue[]) => void;
  max: number;
  addLabel: string;
  options?: LinkOption[];
}) {
  return (
    <ListEditor
      items={items}
      onChange={onChange}
      max={max}
      newItem={() => ({ label: "", href: "#" })}
      addLabel={addLabel}
      itemLabel={(item, i) => item.label || `Link ${i + 1}`}
      render={(item, update) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputCls} placeholder="Label" value={item.label} onChange={(e) => update({ label: e.target.value })} />
          <LinkInput value={item.href} onChange={(href) => update({ href })} options={options} />
        </div>
      )}
    />
  );
}

type SiteListProps = SectionEditorProps<"site"> & { options?: LinkOption[] };

/** Navbar menu items and their dropdowns (Dashboard → Menus → Header Menu). */
export function NavItemsEditor({ value, onChange, options }: SiteListProps) {
  return (
    <ListEditor
      items={value.nav}
      onChange={(nav) => onChange({ ...value, nav })}
      max={HOME_LIMITS.nav}
      newItem={() => ({ label: "", href: "#", children: [], autoServices: false })}
      addLabel="Add menu item"
      itemLabel={(item, i) => item.label || `Menu item ${i + 1}`}
      render={(item, update) => (
        <>
          <Grid>
            <TextField label="Label" value={item.label} onChange={(label) => update({ label })} />
            <Field label="Link">
              <LinkInput value={item.href} onChange={(href) => update({ href })} options={options} />
            </Field>
          </Grid>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0"
              checked={item.autoServices}
              onChange={(e) => update({ autoServices: e.target.checked })}
            />
            <span>
              List published service pages in this dropdown
              <span className="block text-xs text-muted-foreground">
                Every page published under Dashboard → Services shows here automatically (its title, linking to
                /service/&lt;slug&gt;). Links below are added after them; one with the same label as a service
                page is skipped.
              </span>
            </span>
          </label>
          <Field label={item.autoServices ? "Extra dropdown links (optional)" : "Dropdown links (optional)"}>
            <LinkRows
              items={item.children}
              onChange={(children) => update({ children })}
              max={HOME_LIMITS.navChildren}
              addLabel="Add dropdown link"
              options={options}
            />
          </Field>
        </>
      )}
    />
  );
}

/** Footer link columns (Dashboard → Menus → Footer Menu). */
export function FooterColumnsEditor({ value, onChange, options }: SiteListProps) {
  return (
    <ListEditor
      items={value.footerColumns}
      onChange={(footerColumns) => onChange({ ...value, footerColumns })}
      max={HOME_LIMITS.footerColumns}
      newItem={() => ({ title: "", links: [] })}
      addLabel="Add footer column"
      itemLabel={(item, i) => item.title || `Column ${i + 1}`}
      render={(item, update) => (
        <>
          <TextField label="Column title" value={item.title} onChange={(title) => update({ title })} />
          <LinkRows
            items={item.links}
            onChange={(links) => update({ links })}
            max={HOME_LIMITS.footerLinks}
            addLabel="Add link"
            options={options}
          />
        </>
      )}
    />
  );
}

const linkCls = "font-medium text-brand-link underline-offset-4 hover:underline";

// The navbar (logos, business name, menu items) and the footer are part of this
// `site` block too, but are edited on Dashboard → Menus (app/dashboard/site-menus);
// a homepage save keeps whatever those pages saved (POST /api/homepage).
export default function SiteEditor({ value, onChange }: SectionEditorProps<"site">) {
  const patch = patcher(value, onChange);
  const patchLabels = patcher(value.labels, (labels) => patch({ labels }));

  return (
    <>
      <p className="text-sm text-muted-foreground">
        The navbar and footer are edited on{" "}
        <Link href="/dashboard/site-menus/header" className={linkCls}>
          Header Menu
        </Link>{" "}
        and{" "}
        <Link href="/dashboard/site-menus/footer" className={linkCls}>
          Footer Menu
        </Link>
        . The contact channels below also appear in the footer&apos;s contact column.
      </p>

      <SubHeading>Contact channels</SubHeading>
      <p className="text-xs text-muted-foreground">
        Used by the navbar, hero, founder, FAQ, contact section and footer. Leave a number or the email
        empty to keep using the value from the Header/Footer Menu (shared with the other website).
      </p>
      <Grid>
        <TextField
          label="Phone number"
          placeholder="+91 98765 43210"
          value={value.phone}
          onChange={(phone) => patch({ phone })}
        />
        <TextField
          label="WhatsApp number"
          placeholder="+91 98765 43210"
          value={value.whatsapp}
          onChange={(whatsapp) => patch({ whatsapp })}
        />
        <TextField
          label="Email"
          placeholder="info@example.com"
          value={value.email}
          onChange={(email) => patch({ email })}
        />
        <TextField label="Working hours" value={value.hours} onChange={(hours) => patch({ hours })} />
        <TextField label="Reply time" value={value.replyTime} onChange={(replyTime) => patch({ replyTime })} />
      </Grid>

      <SubHeading>Button labels</SubHeading>
      <Grid>
        <TextField
          label="Call button"
          value={value.labels.callButton}
          hint="Navbar and FAQ owner card (and the founder button when its own label is empty)."
          onChange={(callButton) => patchLabels({ callButton })}
        />
        <TextField
          label="WhatsApp button"
          value={value.labels.whatsappButton}
          hint="FAQ owner card."
          onChange={(whatsappButton) => patchLabels({ whatsappButton })}
        />
      </Grid>
    </>
  );
}
