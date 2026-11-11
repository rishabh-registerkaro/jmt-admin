"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_LIMITS } from "@/app/lib/content/home-content";
import { BRAND_LOGOS } from "@/data/homepageFallback";
import { Field, Grid, ListEditor, SubHeading, TextField, Toggle, inputCls, itemCardCls } from "./fields";
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
  const patchBrand = patcher(value.brand, (brand) => patch({ brand }));
  const patchLabels = patcher(value.labels, (labels) => patch({ labels }));
  const patchLanguages = patcher(value.languages, (languages) => patch({ languages }));
  const updateLanguage = (index: number, change: Partial<(typeof value.languages.items)[number]>) =>
    patchLanguages({
      items: value.languages.items.map((item, i) => (i === index ? { ...item, ...change } : item)),
    });

  return (
    <>
      <SubHeading>Brand &amp; logos</SubHeading>
      <TextField
        label="Business name"
        value={value.brand.name}
        hint="Read out by screen readers on the logo links."
        onChange={(name) => patchBrand({ name })}
      />
      <Grid>
        <ImageField
          label="Navbar logo"
          value={value.brand.headerLogo}
          defaultSrc={BRAND_LOGOS.header.src}
          hint="SVG or PNG with a transparent background, about 3:1. Leave empty for the built-in logo."
          onChange={(headerLogo) => patchBrand({ headerLogo })}
        />
        <ImageField
          label="Footer logo"
          value={value.brand.footerLogo}
          defaultSrc={BRAND_LOGOS.footer.src}
          hint="SVG or PNG with a transparent background, about 3:1. Leave empty for the built-in logo."
          onChange={(footerLogo) => patchBrand({ footerLogo })}
        />
      </Grid>

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
        <TextField
          label="Footer WhatsApp text"
          value={value.labels.whatsappDisplay}
          hint="Leave empty to show the WhatsApp number instead."
          onChange={(whatsappDisplay) => patchLabels({ whatsappDisplay })}
        />
        <TextField
          label="Footer contact column title"
          value={value.labels.footerContactTitle}
          onChange={(footerContactTitle) => patchLabels({ footerContactTitle })}
        />
      </Grid>

      <div className="flex items-center justify-between gap-4 pt-2">
        <SubHeading>Language switcher</SubHeading>
        <Toggle
          checked={value.languages.enabled}
          onChange={(enabled) => patchLanguages({ enabled })}
          label="Show the language switcher"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Translates the whole page automatically (Google Translate). English is the page&apos;s own language and
        always stays available.
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {value.languages.items.map((item, index) => (
          <div key={item.code} className={itemCardCls}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground-light">{item.code.toUpperCase()}</span>
              {item.code !== "en" && (
                <Toggle
                  checked={item.enabled}
                  onChange={(enabled) => updateLanguage(index, { enabled })}
                  label={`Show ${item.name || item.code}`}
                />
              )}
            </div>
            <TextField label="Button text" value={item.label} onChange={(label) => updateLanguage(index, { label })} />
            <TextField label="Full name" value={item.name} onChange={(name) => updateLanguage(index, { name })} />
          </div>
        ))}
      </div>

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
      <p className="text-xs text-muted-foreground">
        A contact column (titled as set under Button labels) with the channels above is always added.
      </p>
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
