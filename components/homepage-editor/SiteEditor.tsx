"use client";

import Link from "next/link";
import { Grid, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

const linkCls = "font-medium text-brand-link underline-offset-4 hover:underline";

// The navbar (logos, business name, menu items) and the footer are part of this
// `site` block too, but are edited on Dashboard → Menus (app/dashboard/site-menus,
// components/homepage-editor/MenuTree.tsx);
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
        empty to keep using the main website&apos;s values (phone and WhatsApp from{" "}
        <Link href="/dashboard/header-menu" className={linkCls}>its header menu</Link>, email and hours from{" "}
        <Link href="/dashboard/footer-menu" className={linkCls}>its footer menu</Link>).
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
