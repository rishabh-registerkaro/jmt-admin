"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_LIMITS } from "@/app/lib/content/home-content";
import { Grid, LinkFields, ListEditor, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function ServicesEditor({ value, onChange }: SectionEditorProps<"services">) {
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
      <LinkFields label="Button" value={value.cta} onChange={(cta) => patch({ cta })} />

      <SubHeading>Service cards</SubHeading>
      <p className="text-xs text-muted-foreground">
        The first card is shown as the large feature tile. Up to {HOME_LIMITS.services} cards.
      </p>
      <ListEditor
        items={value.cards}
        onChange={(cards) => patch({ cards })}
        max={HOME_LIMITS.services}
        newItem={() => ({
          title: "",
          eyebrow: "",
          badge: "",
          href: "#contact",
          image: { src: "", alt: "", focus: "center" as const },
        })}
        addLabel="Add service card"
        itemLabel={(item, i) => item.title || `Card ${i + 1}`}
        render={(item, update) => (
          <>
            <Grid>
              <TextField label="Title" value={item.title} onChange={(title) => update({ title })} />
              <TextField label="Link" value={item.href} placeholder="#contact" onChange={(href) => update({ href })} />
              <TextField
                label="Small text above title (optional)"
                value={item.eyebrow}
                onChange={(eyebrow) => update({ eyebrow })}
              />
              <TextField
                label="Badge (optional)"
                placeholder="Coming soon"
                value={item.badge}
                onChange={(badge) => update({ badge })}
              />
            </Grid>
            <ImageField label="Card photo" value={item.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}
