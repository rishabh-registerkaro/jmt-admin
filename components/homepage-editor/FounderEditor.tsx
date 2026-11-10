"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_LIMITS, HOME_SLOT_DEFAULTS } from "@/app/lib/content/home-content";
import { Field, Grid, StringListEditor, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function FounderEditor({ value, onChange }: SectionEditorProps<"founder">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <TextField label="Heading" value={value.heading} onChange={(heading) => patch({ heading })} />
      <TextField label="Story" multiline rows={5} value={value.story} onChange={(story) => patch({ story })} />
      <Grid cols={3}>
        <TextField label="Name" value={value.name} onChange={(name) => patch({ name })} />
        <TextField label="Role" value={value.role} onChange={(role) => patch({ role })} />
        <TextField
          label="Initials"
          hint="Shown in the FAQ owner card avatar"
          value={value.initials}
          onChange={(initials) => patch({ initials: initials.slice(0, 3) })}
        />
      </Grid>
      <TextField
        label="Call button text"
        hint="Dials the phone number set under Site details & contact"
        value={value.ctaLabel}
        onChange={(ctaLabel) => patch({ ctaLabel })}
      />

      <SubHeading>What every crew comes with</SubHeading>
      <Field label="Assurances">
        <StringListEditor
          items={value.assurances}
          onChange={(assurances) => patch({ assurances })}
          max={HOME_LIMITS.assurances}
          addLabel="Add assurance"
        />
      </Field>

      <SubHeading>Photo</SubHeading>
      <ImageField
        label="Founder portrait"
        value={value.image}
        defaultSrc={HOME_SLOT_DEFAULTS.founder.src}
        onChange={(image) => patch({ image })}
        hint="Portrait (taller than wide) works best."
      />
    </>
  );
}
