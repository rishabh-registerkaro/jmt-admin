"use client";

import ImageField from "@/components/common/ImageField";
import { HOME_SLOT_DEFAULTS } from "@/app/lib/content/home-content";
import { LEAD_FIELDS, type LeadField } from "@/types/homepage";
import { Grid, SubHeading, TextField } from "./fields";
import { patcher, type SectionEditorProps } from "./types";

/** Admin-facing name of each request form field (the field itself is fixed). */
const FIELD_NAMES: Record<LeadField, string> = {
  companyName: "Company name field (optional)",
  name: "Name field",
  phone: "Phone field",
  email: "Email field",
  siteLocation: "Site location field",
  headcount: "Headcount field",
  startDate: "Start date field (optional)",
};

export default function ContactEditor({ value, onChange }: SectionEditorProps<"contact">) {
  const patch = patcher(value, onChange);
  const patchLabels = patcher(value.labels, (labels) => patch({ labels }));
  const patchForm = patcher(value.form, (form) => patch({ form }));
  const patchFieldLabels = patcher(value.form.labels, (labels) => patchForm({ labels }));

  return (
    <>
      <TextField label="Heading" value={value.title} onChange={(title) => patch({ title })} />

      <SubHeading>Contact card</SubHeading>
      <p className="text-xs text-muted-foreground">
        The phone number and reply time come from Site details &amp; contact.
      </p>
      <Grid>
        <TextField label="Card title" value={value.cardTitle} onChange={(cardTitle) => patch({ cardTitle })} />
        <TextField label="Card text" value={value.cardText} onChange={(cardText) => patch({ cardText })} />
      </Grid>
      <Grid>
        <TextField label="Call row label" value={value.labels.call} onChange={(call) => patchLabels({ call })} />
        <TextField
          label="WhatsApp row label"
          value={value.labels.whatsapp}
          onChange={(whatsapp) => patchLabels({ whatsapp })}
        />
        <TextField
          label="WhatsApp row text"
          value={value.labels.whatsappValue}
          placeholder="Chat with us"
          onChange={(whatsappValue) => patchLabels({ whatsappValue })}
        />
        <TextField label="Reply time row label" value={value.labels.reply} onChange={(reply) => patchLabels({ reply })} />
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

      <p className="pt-1 text-sm font-medium text-foreground-light">Field labels</p>
      <Grid cols={3}>
        {LEAD_FIELDS.map((field) => (
          <TextField
            key={field}
            label={FIELD_NAMES[field]}
            value={value.form.labels[field]}
            onChange={(text) => patchFieldLabels({ [field]: text })}
          />
        ))}
      </Grid>
      <Grid cols={3}>
        <TextField
          label="Optional field hint"
          value={value.form.optionalHint}
          placeholder="(optional)"
          hint="Shown after the label of optional fields. Leave empty to hide."
          onChange={(optionalHint) => patchForm({ optionalHint })}
        />
        <TextField label="Submit button" value={value.form.submit} onChange={(submit) => patchForm({ submit })} />
        <TextField
          label="Submit button while sending"
          value={value.form.submitting}
          onChange={(submitting) => patchForm({ submitting })}
        />
      </Grid>

      <p className="pt-1 text-sm font-medium text-foreground-light">After sending</p>
      <Grid>
        <TextField
          label="Success title"
          value={value.form.successTitle}
          onChange={(successTitle) => patchForm({ successTitle })}
        />
        <TextField
          label="“Send another” button"
          value={value.form.resetLabel}
          onChange={(resetLabel) => patchForm({ resetLabel })}
        />
      </Grid>
      <TextField
        label="Success message"
        multiline
        rows={2}
        value={value.form.successText}
        onChange={(successText) => patchForm({ successText })}
      />
      <Grid>
        <TextField
          label="Message when fields are invalid"
          multiline
          rows={2}
          value={value.form.invalidText}
          onChange={(invalidText) => patchForm({ invalidText })}
        />
        <TextField
          label="Message when sending fails"
          multiline
          rows={2}
          value={value.form.errorText}
          onChange={(errorText) => patchForm({ errorText })}
        />
      </Grid>
      <p className="text-xs text-muted-foreground">
        Form submissions appear under Leads. Messages for individual fields (e.g. an invalid phone number) are
        built in.
      </p>
    </>
  );
}
