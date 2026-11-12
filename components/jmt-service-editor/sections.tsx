"use client";

// Section editors for a JMT service page (types/service.ts → ServicePageContent).
// Same building blocks as the Homepage editor (components/homepage-editor/fields).

import ImageField from "@/components/common/ImageField";
import {
  Field,
  Grid,
  ListEditor,
  SelectField,
  StringListEditor,
  SubHeading,
  TextField,
} from "@/components/homepage-editor/fields";
import { patcher } from "@/components/homepage-editor/types";
import type { HomeImage } from "@/types/homepage";
import {
  SERVICE_SECTION_IDS,
  type CheckIcon,
  type IncludedChipIcon,
  type ServiceFactIcon,
  type ServicePageContent,
  type ServiceSectionCopy,
} from "@/types/service";

type C = ServicePageContent;
export interface PartProps<K extends keyof C> {
  value: C[K];
  onChange: (value: C[K]) => void;
}

const FACT_ICONS: readonly ServiceFactIcon[] = ["users", "clock", "moon", "refresh"];
const CHIP_ICONS: readonly IncludedChipIcon[] = ["check", "shield"];
const CHECK_ICONS: readonly CheckIcon[] = ["hammer", "id", "info", "hat", "user"];

/** New list items start with a built-in photo, so a page never shows an empty frame. */
const PLACEHOLDER_IMAGE: HomeImage = { src: "/service/hero.webp", alt: "", width: 1200, height: 800 };

const HINT_IMAGE = "Pick from the Media Library, upload, or paste an https:// URL. Clearing it restores the original photo.";

// ── Shared pieces ────────────────────────────────────────────────────────────

/** ImageField edits src/alt/focus; width/height (aspect hints) are kept. */
function ServiceImage({ label, value, onChange }: { label: string; value: HomeImage; onChange: (v: HomeImage) => void }) {
  return (
    <ImageField
      label={label}
      hint={HINT_IMAGE}
      value={{ src: value.src, alt: value.alt, focus: value.focus ?? "center" }}
      onChange={(v) => onChange({ ...value, src: v.src, alt: v.alt, focus: v.focus })}
    />
  );
}

/** Eyebrow + heading (accent part in orange) + optional tail and intro. */
function CopyFields({ value, onChange }: { value: ServiceSectionCopy; onChange: (v: ServiceSectionCopy) => void }) {
  const heading = (patch: Partial<ServiceSectionCopy["heading"]>) =>
    onChange({ ...value, heading: { ...value.heading, ...patch } });
  return (
    <>
      <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => onChange({ ...value, eyebrow })} />
      <Grid cols={3}>
        <TextField label="Heading" value={value.heading.lead} onChange={(lead) => heading({ lead })} />
        <TextField
          label="Heading — orange part"
          value={value.heading.accent}
          onChange={(accent) => heading({ accent })}
        />
        {"tail" in value.heading && (
          <TextField
            label="Heading — after the orange part"
            value={value.heading.tail ?? ""}
            onChange={(tail) => heading({ tail })}
          />
        )}
      </Grid>
      {"intro" in value && (
        <TextField
          label="Intro"
          multiline
          rows={2}
          value={value.intro ?? ""}
          onChange={(intro) => onChange({ ...value, intro })}
        />
      )}
    </>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

export function HeroPart({ value, onChange }: PartProps<"hero">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <SubHeading>Breadcrumb</SubHeading>
      <Grid cols={3}>
        {(["home", "services", "current"] as const).map((key) => (
          <TextField
            key={key}
            label={{ home: "Home", services: "Services", current: "This page" }[key]}
            value={value.breadcrumb[key]}
            onChange={(v) => patch({ breadcrumb: { ...value.breadcrumb, [key]: v } })}
          />
        ))}
      </Grid>
      <SubHeading>Headline</SubHeading>
      <TextField label="Tag above the headline" value={value.tag} onChange={(tag) => patch({ tag })} />
      <Grid cols={3}>
        <TextField label="Title" value={value.title.lead} onChange={(lead) => patch({ title: { ...value.title, lead } })} />
        <TextField
          label="Title — orange part"
          value={value.title.accent}
          onChange={(accent) => patch({ title: { ...value.title, accent } })}
        />
        <TextField
          label="Title — after the orange part"
          value={value.title.tail}
          onChange={(tail) => patch({ title: { ...value.title, tail } })}
        />
      </Grid>
      <TextField label="Subtitle" multiline value={value.subtitle} onChange={(subtitle) => patch({ subtitle })} />
      <Grid>
        <TextField
          label="Main button"
          hint="Scrolls to the contact form"
          value={value.primaryCta}
          onChange={(primaryCta) => patch({ primaryCta })}
        />
        <TextField label="WhatsApp button" value={value.whatsappCta} onChange={(whatsappCta) => patch({ whatsappCta })} />
      </Grid>
      <ServiceImage label="Hero photo" value={value.image} onChange={(image) => patch({ image })} />
      <SubHeading>Quick facts</SubHeading>
      <ListEditor
        items={value.facts}
        onChange={(facts) => patch({ facts })}
        max={4}
        newItem={() => ({ icon: "users" as ServiceFactIcon, label: "", value: "" })}
        addLabel="Add fact"
        itemLabel={(f, i) => f.label || `Fact ${i + 1}`}
        render={(f, update) => (
          <Grid cols={3}>
            <SelectField label="Icon" value={f.icon} options={FACT_ICONS} onChange={(icon) => update({ icon })} />
            <TextField label="Label" value={f.label} onChange={(label) => update({ label })} />
            <TextField label="Value" value={f.value} onChange={(v) => update({ value: v })} />
          </Grid>
        )}
      />
    </>
  );
}

const SECTION_ID_OPTIONS = Object.values(SERVICE_SECTION_IDS);

export function SubnavPart({ value, onChange }: PartProps<"subnav">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <p className="text-xs text-muted-foreground">
        The sticky bar under the hero. Links to hidden sections are left out automatically.
      </p>
      <ListEditor
        items={value.links}
        onChange={(links) => patch({ links })}
        max={9}
        newItem={() => ({ id: "overview", label: "" })}
        addLabel="Add link"
        itemLabel={(l, i) => l.label || `Link ${i + 1}`}
        render={(l, update) => (
          <Grid>
            <TextField label="Label" value={l.label} onChange={(label) => update({ label })} />
            <SelectField label="Scrolls to section" value={l.id} options={SECTION_ID_OPTIONS} onChange={(id) => update({ id })} />
          </Grid>
        )}
      />
      <TextField label="Button" hint="Scrolls to the contact form" value={value.cta} onChange={(cta) => patch({ cta })} />
    </>
  );
}

export function UseCasesPart({ value, onChange }: PartProps<"useCases">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <SubHeading>Cards</SubHeading>
      <ListEditor
        items={value.cards}
        onChange={(cards) => patch({ cards })}
        max={6}
        newItem={() => ({ title: "", text: "", image: PLACEHOLDER_IMAGE })}
        addLabel="Add card"
        itemLabel={(c, i) => c.title || `Card ${i + 1}`}
        render={(c, update) => (
          <>
            <TextField label="Title" value={c.title} onChange={(title) => update({ title })} />
            <TextField label="Text" multiline rows={2} value={c.text} onChange={(text) => update({ text })} />
            <ServiceImage label="Photo" value={c.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}

export function IncludedPart({ value, onChange }: PartProps<"included">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <ServiceImage label="Photo" value={value.image} onChange={(image) => patch({ image })} />
      <SubHeading>Chips on the photo</SubHeading>
      <ListEditor
        items={value.chips}
        onChange={(chips) => patch({ chips })}
        max={4}
        newItem={() => ({ icon: "check" as IncludedChipIcon, label: "" })}
        addLabel="Add chip"
        itemLabel={(c, i) => c.label || `Chip ${i + 1}`}
        render={(c, update) => (
          <Grid>
            <SelectField label="Icon" value={c.icon} options={CHIP_ICONS} onChange={(icon) => update({ icon })} />
            <TextField label="Label" value={c.label} onChange={(label) => update({ label })} />
          </Grid>
        )}
      />
      <SubHeading>What JMT provides</SubHeading>
      <Grid>
        <TextField label="Badge" value={value.provides.badge} onChange={(badge) => patch({ provides: { ...value.provides, badge } })} />
        <TextField label="Title" value={value.provides.title} onChange={(title) => patch({ provides: { ...value.provides, title } })} />
      </Grid>
      <StringListEditor
        items={value.provides.items}
        onChange={(items) => patch({ provides: { ...value.provides, items } })}
        max={14}
        addLabel="Add item"
      />
      <SubHeading>What the client provides</SubHeading>
      <Grid>
        <TextField label="Badge" value={value.yours.badge} onChange={(badge) => patch({ yours: { ...value.yours, badge } })} />
        <TextField label="Title" value={value.yours.title} onChange={(title) => patch({ yours: { ...value.yours, title } })} />
      </Grid>
      <StringListEditor
        items={value.yours.items}
        onChange={(items) => patch({ yours: { ...value.yours, items } })}
        max={14}
        addLabel="Add item"
      />
      <Grid>
        <TextField
          label="“Agreed” note — label"
          value={value.yours.agreed.label}
          onChange={(label) => patch({ yours: { ...value.yours, agreed: { ...value.yours.agreed, label } } })}
        />
        <TextField
          label="“Agreed” note — text"
          value={value.yours.agreed.text}
          onChange={(text) => patch({ yours: { ...value.yours, agreed: { ...value.yours.agreed, text } } })}
        />
      </Grid>
    </>
  );
}

export function RolesPart({ value, onChange }: PartProps<"roles">) {
  const patch = patcher(value, onChange);
  const allRoles = value.trades.flatMap((t) => t.roles);
  const togglePreselected = (id: string, on: boolean) =>
    patch({ preselected: on ? [...value.preselected, id] : value.preselected.filter((x) => x !== id) });

  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <SubHeading>Trades and roles</SubHeading>
      <ListEditor
        items={value.trades}
        onChange={(trades) => patch({ trades })}
        max={8}
        newItem={() => ({ id: "", name: "", image: PLACEHOLDER_IMAGE, roles: [] })}
        addLabel="Add trade"
        itemLabel={(t, i) => t.name || `Trade ${i + 1}`}
        render={(t, update) => (
          <>
            <TextField label="Trade name" value={t.name} onChange={(name) => update({ name })} />
            <ServiceImage label="Photo" value={t.image} onChange={(image) => update({ image })} />
            <ListEditor
              items={t.roles}
              onChange={(roles) => update({ roles })}
              max={10}
              newItem={() => ({ id: "", name: "", level: "Skilled" })}
              addLabel="Add role"
              itemLabel={(r, i) => r.name || `Role ${i + 1}`}
              render={(r, updateRole) => (
                <Grid>
                  <TextField label="Role" value={r.name} onChange={(name) => updateRole({ name })} />
                  <TextField
                    label="Level"
                    placeholder="Skilled / Semi-skilled / Unskilled"
                    value={r.level}
                    onChange={(level) => updateRole({ level })}
                  />
                </Grid>
              )}
            />
          </>
        )}
      />
      <Field label="Ticked when the page opens" hint="New roles can be ticked here after the page is saved once.">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {allRoles.map((r, i) => (
            <label key={r.id || `new-${i}`} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                disabled={!r.id}
                checked={Boolean(r.id) && value.preselected.includes(r.id)}
                onChange={(e) => togglePreselected(r.id, e.target.checked)}
              />
              {r.name || "(unnamed role)"}
            </label>
          ))}
        </div>
      </Field>
      <SubHeading>Selection bar</SubHeading>
      <Grid>
        <TextField
          label="Summary"
          hint="{n} = number of roles, {list} = their names"
          value={value.summary}
          onChange={(summary) => patch({ summary })}
        />
        <TextField label="Summary (phones)" value={value.summaryShort} onChange={(summaryShort) => patch({ summaryShort })} />
        <TextField label="Nothing selected" value={value.emptySummary} onChange={(emptySummary) => patch({ emptySummary })} />
        <TextField label="Continue button" value={value.continueCta} onChange={(continueCta) => patch({ continueCta })} />
        <TextField
          label="Continue button (phones)"
          value={value.continueShort}
          onChange={(continueShort) => patch({ continueShort })}
        />
      </Grid>
    </>
  );
}

export function CrewPart({ value, onChange }: PartProps<"crew">) {
  const patch = patcher(value, onChange);
  const sample = value.sample;
  const patchSample = (p: Partial<typeof sample>) => patch({ sample: { ...sample, ...p } });
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <SubHeading>Checks</SubHeading>
      <ListEditor
        items={value.checks}
        onChange={(checks) => patch({ checks })}
        max={8}
        newItem={() => ({ icon: "hammer" as CheckIcon, label: "", title: "", text: "" })}
        addLabel="Add check"
        itemLabel={(c, i) => c.title || `Check ${i + 1}`}
        render={(c, update) => (
          <>
            <Grid cols={3}>
              <SelectField label="Icon" value={c.icon} options={CHECK_ICONS} onChange={(icon) => update({ icon })} />
              <TextField label="Label" placeholder="Check 01" value={c.label} onChange={(label) => update({ label })} />
              <TextField label="Title" value={c.title} onChange={(title) => update({ title })} />
            </Grid>
            <TextField label="Text" multiline rows={2} value={c.text} onChange={(text) => update({ text })} />
          </>
        )}
      />
      <TextField label="“Cleared” label" value={value.clearedLabel} onChange={(clearedLabel) => patch({ clearedLabel })} />

      <SubHeading>Sample crew list</SubHeading>
      <ServiceImage label="Photo" value={sample.image} onChange={(image) => patchSample({ image })} />
      <Grid>
        <TextField label="Photo caption" value={sample.caption} onChange={(caption) => patchSample({ caption })} />
        <TextField label="Kicker" value={sample.kicker} onChange={(kicker) => patchSample({ kicker })} />
        <TextField label="Title" value={sample.title} onChange={(title) => patchSample({ title })} />
        <TextField label="Stamp" value={sample.stamp} onChange={(stamp) => patchSample({ stamp })} />
        <TextField
          label="Column — worker"
          value={sample.columns.worker}
          onChange={(worker) => patchSample({ columns: { ...sample.columns, worker } })}
        />
        <TextField
          label="Column — trade"
          value={sample.columns.trade}
          onChange={(trade) => patchSample({ columns: { ...sample.columns, trade } })}
        />
      </Grid>
      <Field label="Check columns">
        <StringListEditor
          items={sample.columns.checks}
          onChange={(checks) => patchSample({ columns: { ...sample.columns, checks } })}
          max={6}
          addLabel="Add column"
        />
      </Field>
      <TextField
        label="Check columns (phones)"
        value={sample.checksShort}
        onChange={(checksShort) => patchSample({ checksShort })}
      />
      <ListEditor
        items={sample.workers}
        onChange={(workers) => patchSample({ workers })}
        max={10}
        newItem={() => ({ name: "", trade: "" })}
        addLabel="Add worker"
        itemLabel={(w, i) => w.name || `Worker ${i + 1}`}
        render={(w, update) => (
          <Grid>
            <TextField label="Name" value={w.name} onChange={(name) => update({ name })} />
            <TextField label="Trade" value={w.trade} onChange={(trade) => update({ trade })} />
          </Grid>
        )}
      />
      <Grid>
        <TextField
          label="Crew lead — title"
          value={sample.lead.title}
          onChange={(title) => patchSample({ lead: { ...sample.lead, title } })}
        />
        <TextField
          label="Crew lead — duties"
          value={sample.lead.duties}
          onChange={(duties) => patchSample({ lead: { ...sample.lead, duties } })}
        />
        <TextField label="Button" value={sample.cta} onChange={(cta) => patchSample({ cta })} />
        <TextField label="Note" value={sample.note} onChange={(note) => patchSample({ note })} />
      </Grid>
    </>
  );
}

export function PlansPart({ value, onChange }: PartProps<"plans">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <Grid cols={3}>
        <TextField label="“Who it suits” label" value={value.labels.suits} onChange={(suits) => patch({ labels: { ...value.labels, suits } })} />
        <TextField label="“How it works” label" value={value.labels.how} onChange={(how) => patch({ labels: { ...value.labels, how } })} />
        <TextField label="Rate note" value={value.labels.rate} onChange={(rate) => patch({ labels: { ...value.labels, rate } })} />
      </Grid>
      <ListEditor
        items={value.plans}
        onChange={(plans) => patch({ plans })}
        max={4}
        newItem={() => ({ name: "", duration: "", highlight: "", suits: "", how: "", image: PLACEHOLDER_IMAGE })}
        addLabel="Add plan"
        itemLabel={(p, i) => p.name || `Plan ${i + 1}`}
        render={(p, update) => (
          <>
            <Grid cols={3}>
              <TextField label="Name" value={p.name} onChange={(name) => update({ name })} />
              <TextField label="Duration" value={p.duration} onChange={(duration) => update({ duration })} />
              <TextField
                label="Highlight pill"
                hint="Optional — e.g. “Start here”. Highlights the card."
                value={p.highlight ?? ""}
                onChange={(highlight) => update({ highlight })}
              />
            </Grid>
            <TextField label="Who it suits" multiline rows={2} value={p.suits} onChange={(suits) => update({ suits })} />
            <TextField label="How it works" multiline rows={2} value={p.how} onChange={(how) => update({ how })} />
            <ServiceImage label="Photo" value={p.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}

export function StepsPart({ value, onChange }: PartProps<"steps">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <ListEditor
        items={value.steps}
        onChange={(steps) => patch({ steps })}
        max={6}
        newItem={() => ({ timing: "", title: "", text: "", image: PLACEHOLDER_IMAGE })}
        addLabel="Add step"
        itemLabel={(s, i) => s.title || `Step ${i + 1}`}
        render={(s, update) => (
          <>
            <Grid>
              <TextField label="When" placeholder="Day 0" value={s.timing} onChange={(timing) => update({ timing })} />
              <TextField label="Title" value={s.title} onChange={(title) => update({ title })} />
            </Grid>
            <TextField label="Text" multiline rows={2} value={s.text} onChange={(text) => update({ text })} />
            <ServiceImage label="Photo" value={s.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}

export function FaqPart({ value, onChange }: PartProps<"faq">) {
  const patch = patcher(value, onChange);
  const card = (p: Partial<typeof value.card>) => patch({ card: { ...value.card, ...p } });
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <SubHeading>Questions</SubHeading>
      <ListEditor
        items={value.items}
        onChange={(items) => patch({ items })}
        max={20}
        newItem={() => ({ id: "", question: "", answer: "" })}
        addLabel="Add question"
        itemLabel={(q, i) => q.question || `Question ${i + 1}`}
        render={(q, update) => (
          <>
            <TextField label="Question" value={q.question} onChange={(question) => update({ question })} />
            <TextField label="Answer" multiline rows={3} value={q.answer} onChange={(answer) => update({ answer })} />
          </>
        )}
      />
      <SubHeading>Contact card</SubHeading>
      <p className="text-xs text-muted-foreground">Phone and WhatsApp numbers come from Homepage → site-wide settings.</p>
      <ServiceImage label="Portrait" value={value.card.image} onChange={(image) => card({ image })} />
      <Grid>
        <TextField label="Kicker" value={value.card.kicker} onChange={(kicker) => card({ kicker })} />
        <TextField label="Title" value={value.card.title} onChange={(title) => card({ title })} />
        <TextField label="Role" value={value.card.role} onChange={(role) => card({ role })} />
        <TextField label="Call button" value={value.card.call} onChange={(call) => card({ call })} />
        <TextField label="WhatsApp button" value={value.card.whatsapp} onChange={(whatsapp) => card({ whatsapp })} />
      </Grid>
    </>
  );
}

export function RelatedPart({ value, onChange }: PartProps<"related">) {
  const patch = patcher(value, onChange);
  return (
    <>
      <CopyFields value={value.copy} onChange={(copy) => patch({ copy })} />
      <ListEditor
        items={value.services}
        onChange={(services) => patch({ services })}
        max={4}
        newItem={() => ({ kicker: "Service", title: "", text: "", cta: "View service", href: "#contact", image: PLACEHOLDER_IMAGE })}
        addLabel="Add related service"
        itemLabel={(s, i) => s.title || `Service ${i + 1}`}
        render={(s, update) => (
          <>
            <Grid>
              <TextField label="Kicker" value={s.kicker} onChange={(kicker) => update({ kicker })} />
              <TextField label="Title" value={s.title} onChange={(title) => update({ title })} />
            </Grid>
            <TextField label="Text" multiline rows={2} value={s.text} onChange={(text) => update({ text })} />
            <Grid>
              <TextField label="Button" value={s.cta} onChange={(cta) => update({ cta })} />
              <TextField
                label="Link"
                hint='Another service page ("/service/supervision-and-compliance"), "#contact", or an https:// URL'
                value={s.href}
                onChange={(href) => update({ href })}
              />
            </Grid>
            <ServiceImage label="Photo" value={s.image} onChange={(image) => update({ image })} />
          </>
        )}
      />
    </>
  );
}
