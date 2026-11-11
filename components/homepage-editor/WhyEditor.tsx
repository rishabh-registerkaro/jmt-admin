"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_LIMITS, HOME_SLOT_DEFAULTS } from "@/app/lib/content/home-content";
import { Grid, ListEditor, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function WhyEditor({ value, onChange }: SectionEditorProps<"why">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <Grid>
        <TextField label="Heading — start" value={value.titleLead} onChange={(titleLead) => patch({ titleLead })} />
        <TextField
          label="Heading — highlighted"
          value={value.titleAccent}
          onChange={(titleAccent) => patch({ titleAccent })}
        />
      </Grid>
      <TextField label="Intro" multiline value={value.intro} onChange={(intro) => patch({ intro })} />

      <SubHeading>Reasons</SubHeading>
      <p className="text-xs text-muted-foreground">Numbered automatically (01, 02, …) in this order.</p>
      <ListEditor
        items={value.reasons}
        onChange={(reasons) => patch({ reasons })}
        max={HOME_LIMITS.reasons}
        newItem={() => ({ title: "", description: "", tag: "" })}
        addLabel="Add reason"
        itemLabel={(item, i) => `${String(i + 1).padStart(2, "0")} · ${item.title || "Untitled"}`}
        render={(item, update) => (
          <>
            <Grid>
              <TextField label="Title" value={item.title} onChange={(title) => update({ title })} />
              <TextField label="Tag" value={item.tag} onChange={(tag) => update({ tag })} />
            </Grid>
            <TextField
              label="Description"
              multiline
              rows={2}
              value={item.description}
              onChange={(description) => update({ description })}
            />
          </>
        )}
      />

      <SubHeading>Photo</SubHeading>
      <ImageField
        label="Section photo"
        value={value.image}
        defaultSrc={HOME_SLOT_DEFAULTS.why.src}
        onChange={(image) => patch({ image })}
      />
      <TextField
        label="Badge on photo"
        value={value.badge}
        hint="Leave empty to hide the badge."
        onChange={(badge) => patch({ badge })}
      />
    </>
  );
}
