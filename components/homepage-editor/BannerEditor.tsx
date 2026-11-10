"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_SLOT_DEFAULTS } from "@/app/lib/content/home-content";
import { LinkFields, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

export default function BannerEditor({ value, onChange }: SectionEditorProps<"banner">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <TextField label="Title" value={value.title} onChange={(title) => patch({ title })} />
      <TextField label="Text" value={value.copy} onChange={(copy) => patch({ copy })} />
      <LinkFields label="Button" value={value.cta} onChange={(cta) => patch({ cta })} />
      <ImageField
        label="Banner photo"
        value={value.image}
        defaultSrc={HOME_SLOT_DEFAULTS.banner.src}
        onChange={(image) => patch({ image })}
        hint="Very wide photo (about 3:1)."
      />
    </>
  );
}
