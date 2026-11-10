"use client";

import { HOME_LIMITS, type HomeFaqGroupValue } from "@/app/lib/content/home-content";
import { Grid, LinkFields, ListEditor, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

function FaqGroupEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: HomeFaqGroupValue;
  onChange: (value: HomeFaqGroupValue) => void;
}) {
  const patch = patcher(value, onChange);
  return (
    <>
      <SubHeading>{title}</SubHeading>
      <TextField label="Tab label" value={value.label} onChange={(label) => patch({ label })} />
      <ListEditor
        items={value.items}
        onChange={(items) => patch({ items })}
        max={HOME_LIMITS.faqItems}
        newItem={() => ({ question: "", answer: "" })}
        addLabel="Add question"
        itemLabel={(item, i) => item.question || `Question ${i + 1}`}
        render={(item, update) => (
          <>
            <TextField label="Question" value={item.question} onChange={(question) => update({ question })} />
            <TextField
              label="Answer"
              multiline
              rows={3}
              value={item.answer}
              onChange={(answer) => update({ answer })}
            />
          </>
        )}
      />
    </>
  );
}

export default function FaqEditor({ value, onChange }: SectionEditorProps<"faq">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <Grid>
        <TextField label="Heading" value={value.title} onChange={(title) => patch({ title })} />
        <TextField label="Intro" value={value.intro} onChange={(intro) => patch({ intro })} />
      </Grid>

      <SubHeading>Owner card</SubHeading>
      <p className="text-xs text-slate-500">Name and initials come from the Founder section.</p>
      <Grid>
        <TextField label="Role line" value={value.ownerRole} onChange={(ownerRole) => patch({ ownerRole })} />
        <TextField label="Card title" value={value.ownerTitle} onChange={(ownerTitle) => patch({ ownerTitle })} />
      </Grid>
      <TextField label="Card text" value={value.ownerText} onChange={(ownerText) => patch({ ownerText })} />

      <FaqGroupEditor
        title="Questions — companies tab"
        value={value.companies}
        onChange={(companies) => patch({ companies })}
      />
      <FaqGroupEditor
        title="Questions — workers tab"
        value={value.workers}
        onChange={(workers) => patch({ workers })}
      />
      <p className="text-xs text-slate-500">
        “Join our crew” links (#join-our-crew) open the workers tab.
      </p>

      <SubHeading>Below the questions</SubHeading>
      <TextField label="Text" value={value.moreText} onChange={(moreText) => patch({ moreText })} />
      <LinkFields label="Link" value={value.moreLink} onChange={(moreLink) => patch({ moreLink })} />
    </>
  );
}
