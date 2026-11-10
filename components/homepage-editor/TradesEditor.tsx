"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_LIMITS, TRADE_ICONS } from "@/app/lib/content/home-content";
import { Grid, ListEditor, SelectField, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function TradesEditor({ value, onChange }: SectionEditorProps<"trades">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <TextField label="Heading" value={value.title} onChange={(title) => patch({ title })} />
      <TextField label="Intro" value={value.intro} onChange={(intro) => patch({ intro })} />

      <SubHeading>Trade cards</SubHeading>
      <ListEditor
        items={value.cards}
        onChange={(cards) => patch({ cards })}
        max={HOME_LIMITS.trades}
        newItem={() => ({ title: "", icon: "helpers" as const, image: { src: "", alt: "", focus: "center" as const } })}
        addLabel="Add trade"
        itemLabel={(item, i) => item.title || `Trade ${i + 1}`}
        render={(item, update) => (
          <>
            <Grid>
              <TextField label="Title" value={item.title} onChange={(title) => update({ title })} />
              <SelectField label="Icon" value={item.icon} options={TRADE_ICONS} onChange={(icon) => update({ icon })} />
            </Grid>
            <ImageField label="Photo" value={item.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}
