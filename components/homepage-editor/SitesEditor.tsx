"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_LIMITS } from "@/app/lib/content/home-content";
import { Grid, ListEditor, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function SitesEditor({ value, onChange }: SectionEditorProps<"sites">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <TextField label="Heading" value={value.title} onChange={(title) => patch({ title })} />

      <SubHeading>Site types (carousel)</SubHeading>
      <ListEditor
        items={value.cards}
        onChange={(cards) => patch({ cards })}
        max={HOME_LIMITS.sites}
        newItem={() => ({ title: "", description: "", image: { src: "", alt: "", focus: "center" as const } })}
        addLabel="Add site type"
        itemLabel={(item, i) => item.title || `Site type ${i + 1}`}
        render={(item, update) => (
          <>
            <Grid>
              <TextField label="Title" value={item.title} onChange={(title) => update({ title })} />
              <TextField
                label="Description"
                value={item.description}
                onChange={(description) => update({ description })}
              />
            </Grid>
            <ImageField label="Photo" value={item.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}
