"use client";

import ImageField from "@/components/common/ImageField";
import { HERO_ICONS, HOME_LIMITS, HOME_SLOT_DEFAULTS } from "@/app/lib/content/home-content";
import { Grid, LinkFields, ListEditor, SelectField, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function HeroEditor({ value, onChange }: SectionEditorProps<"hero">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => patch({ eyebrow })} />
      <Grid cols={3}>
        <TextField label="Title — start" value={value.titleLead} onChange={(titleLead) => patch({ titleLead })} />
        <TextField
          label="Title — highlighted"
          hint="Shown in the accent colour"
          value={value.titleAccent}
          onChange={(titleAccent) => patch({ titleAccent })}
        />
        <TextField label="Title — end" value={value.titleTail} onChange={(titleTail) => patch({ titleTail })} />
      </Grid>
      <TextField label="Subtitle" multiline value={value.subtitle} onChange={(subtitle) => patch({ subtitle })} />

      <SubHeading>Buttons</SubHeading>
      <LinkFields label="Primary button" value={value.primaryCta} onChange={(primaryCta) => patch({ primaryCta })} />
      <LinkFields
        label="Secondary button"
        value={value.secondaryCta}
        onChange={(secondaryCta) => patch({ secondaryCta })}
      />
      <TextField
        label="WhatsApp link text"
        hint="Links to the WhatsApp number set under Site details & contact"
        value={value.whatsappCta}
        onChange={(whatsappCta) => patch({ whatsappCta })}
      />

      <SubHeading>Trust points</SubHeading>
      <ListEditor
        items={value.trustPoints}
        onChange={(trustPoints) => patch({ trustPoints })}
        max={HOME_LIMITS.trustPoints}
        newItem={() => ({ icon: "verified" as const, label: "" })}
        addLabel="Add trust point"
        itemLabel={(item, i) => item.label || `Trust point ${i + 1}`}
        render={(item, update) => (
          <Grid>
            <TextField label="Label" value={item.label} onChange={(label) => update({ label })} />
            <SelectField label="Icon" value={item.icon} options={HERO_ICONS} onChange={(icon) => update({ icon })} />
          </Grid>
        )}
      />

      <SubHeading>Background photo</SubHeading>
      <ImageField
        label="Hero image"
        value={value.image}
        defaultSrc={HOME_SLOT_DEFAULTS.hero.src}
        onChange={(image) => patch({ image })}
        hint="Wide landscape photo, at least 1600px wide."
      />
    </>
  );
}
