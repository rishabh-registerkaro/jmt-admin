"use client";

import { HOME_LIMITS, PROCESS_ICONS } from "@/app/lib/content/home-content";
import { Grid, ListEditor, SelectField, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function ProcessEditor({ value, onChange }: SectionEditorProps<"process">) {
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
      <TextField label="Intro" multiline rows={2} value={value.intro} onChange={(intro) => patch({ intro })} />

      <SubHeading>Steps</SubHeading>
      <p className="text-xs text-slate-500">Numbered automatically in this order.</p>
      <ListEditor
        items={value.steps}
        onChange={(steps) => patch({ steps })}
        max={HOME_LIMITS.steps}
        newItem={() => ({
          icon: "requirement" as const,
          title: "",
          description: "",
          outcomeLabel: "",
          outcome: "",
        })}
        addLabel="Add step"
        itemLabel={(item, i) => `Step ${i + 1} · ${item.title || "Untitled"}`}
        render={(item, update) => (
          <>
            <Grid>
              <TextField label="Title" value={item.title} onChange={(title) => update({ title })} />
              <SelectField label="Icon" value={item.icon} options={PROCESS_ICONS} onChange={(icon) => update({ icon })} />
            </Grid>
            <TextField
              label="Description"
              multiline
              rows={2}
              value={item.description}
              onChange={(description) => update({ description })}
            />
            <Grid>
              <TextField
                label="Outcome label"
                placeholder="You send"
                value={item.outcomeLabel}
                onChange={(outcomeLabel) => update({ outcomeLabel })}
              />
              <TextField label="Outcome" value={item.outcome} onChange={(outcome) => update({ outcome })} />
            </Grid>
          </>
        )}
      />
    </>
  );
}
