"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_SLOT_DEFAULTS } from "@/app/lib/content/home-content";
import { Grid, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function ContactEditor({ value, onChange }: SectionEditorProps<"contact">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <TextField label="Heading" value={value.title} onChange={(title) => patch({ title })} />

      <SubHeading>Contact card</SubHeading>
      <p className="text-xs text-slate-500">
        Phone, WhatsApp and reply time come from Site details &amp; contact.
      </p>
      <Grid>
        <TextField label="Card title" value={value.cardTitle} onChange={(cardTitle) => patch({ cardTitle })} />
        <TextField label="Card text" value={value.cardText} onChange={(cardText) => patch({ cardText })} />
      </Grid>
      <ImageField
        label="Card photo"
        value={value.image}
        defaultSrc={HOME_SLOT_DEFAULTS.contact.src}
        onChange={(image) => patch({ image })}
      />

      <SubHeading>Request form</SubHeading>
      <Grid>
        <TextField label="Form title" value={value.formTitle} onChange={(formTitle) => patch({ formTitle })} />
        <TextField label="Form text" value={value.formText} onChange={(formText) => patch({ formText })} />
      </Grid>
      <p className="text-xs text-slate-500">Form submissions appear under Leads.</p>
    </>
  );
}
