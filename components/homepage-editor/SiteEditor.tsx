"use client";

import { HOME_LIMITS } from "@/app/lib/content/home-content";
import { Field, Grid, ListEditor, SubHeading, TextField, inputCls } from "./fields";
import { patcher, type SectionEditorProps } from "./types";
import type { HomeLinkValue } from "@/app/lib/content/home-content";

/** Compact label + link rows (dropdown children, footer links). */
function LinkRows({
  items,
  onChange,
  max,
  addLabel,
}: {
  items: HomeLinkValue[];
  onChange: (items: HomeLinkValue[]) => void;
  max: number;
  addLabel: string;
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
          <input
            className={inputCls}
            placeholder="#services or https://…"
            value={item.href}
            onChange={(e) => update({ href: e.target.value })}
          />
        </div>
      )}
    />
  );
}

export default function SiteEditor({ value, onChange }: SectionEditorProps<"site">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <SubHeading>Contact channels</SubHeading>
      <p className="text-xs text-slate-500">
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

      <SubHeading>Navbar</SubHeading>
      <ListEditor
        items={value.nav}
        onChange={(nav) => patch({ nav })}
        max={HOME_LIMITS.nav}
        newItem={() => ({ label: "", href: "#", children: [] })}
        addLabel="Add menu item"
        itemLabel={(item, i) => item.label || `Menu item ${i + 1}`}
        render={(item, update) => (
          <>
            <Grid>
              <TextField label="Label" value={item.label} onChange={(label) => update({ label })} />
              <TextField label="Link" value={item.href} onChange={(href) => update({ href })} />
            </Grid>
            <Field label="Dropdown links (optional)">
              <LinkRows
                items={item.children}
                onChange={(children) => update({ children })}
                max={HOME_LIMITS.navChildren}
                addLabel="Add dropdown link"
              />
            </Field>
          </>
        )}
      />

      <SubHeading>Footer</SubHeading>
      <TextField
        label="Footer description"
        multiline
        rows={2}
        value={value.footerDescription}
        onChange={(footerDescription) => patch({ footerDescription })}
      />
      <p className="text-xs text-slate-500">A “Contact” column with the channels above is always added.</p>
      <ListEditor
        items={value.footerColumns}
        onChange={(footerColumns) => patch({ footerColumns })}
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
            />
          </>
        )}
      />
      <TextField
        label="Copyright line (optional)"
        placeholder="© 2026 Joy Maa Tara Bama Kripa"
        value={value.copyright}
        onChange={(copyright) => patch({ copyright })}
      />
    </>
  );
}
