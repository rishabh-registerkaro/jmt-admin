"use client";

// Bengali / Hindi editor for the homepage (Homepage → বাংলা / हिन्दी).
//
// The form is generated from the English content: every visible text field
// gets a row (English on the left, translation on the right), so new CMS
// fields are translatable without touching this file. Each saved translation
// remembers the English it was made from; when the English changes later the
// row is flagged "English changed" and the page shows English (or a matching
// built-in translation) until it is re-translated.

import { useMemo, useState } from "react";
import { FileText, Globe2, Languages } from "lucide-react";
import {
  HOME_META_DEFAULTS,
  META_TRANSLATION_PATHS,
  seedTranslation,
  translatableEntries,
  type HomePageContent,
  type HomeTranslation,
  type TranslatedLanguage,
} from "@/app/lib/content/home-content";
import { SectionCard, inputCls, textareaCls } from "@/components/homepage-editor/fields";

const LANGUAGE_NAMES: Record<TranslatedLanguage, string> = { bn: "Bengali (বাংলা)", hi: "Hindi (हिन्दी)" };

const GROUP_TITLES: Record<string, string> = {
  meta: "SEO (hidden)",
  hero: "Hero",
  services: "Services",
  sites: "Sites we staff",
  why: "Why choose us",
  trades: "Trades",
  process: "How we work",
  founder: "Founder",
  banner: "Banner",
  faq: "FAQ",
  contact: "Contact",
  site: "Navbar, footer & contact details",
};

type Status = "custom" | "builtin" | "outdated" | "missing";

const STATUS_LABEL: Record<Status, { text: string; cls: string }> = {
  custom: { text: "Translated", cls: "bg-brand/10 text-brand-link" },
  builtin: { text: "Built-in", cls: "bg-sky-500/15 text-sky-300" },
  outdated: { text: "English changed", cls: "bg-warning/10 text-warning" },
  missing: { text: "Shows English", cls: "bg-muted text-foreground-light" },
};

/** "faq.companies.items.0.question" → "Companies › Item 1 › Question". */
function fieldName(path: string): string {
  return path
    .split(".")
    .slice(1)
    .map((part) =>
      /^\d+$/.test(part)
        ? `#${Number(part) + 1}`
        : part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()),
    )
    .join(" › ");
}

interface Row {
  path: string;
  english: string;
  saved?: HomeTranslation;
  seed?: string;
  status: Status;
}

export default function TranslationEditor({
  lang,
  content,
  metaTitle,
  metaDescription,
  onChange,
}: {
  lang: TranslatedLanguage;
  content: HomePageContent;
  metaTitle: string;
  metaDescription: string;
  onChange: (entries: Record<string, HomeTranslation>) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });
  const [onlyTodo, setOnlyTodo] = useState(false);
  const entries = content.translations[lang];

  const groups = useMemo(() => {
    const all: [string, string][] = [
      [META_TRANSLATION_PATHS.title, metaTitle || HOME_META_DEFAULTS.metaTitle],
      [META_TRANSLATION_PATHS.description, metaDescription || HOME_META_DEFAULTS.metaDescription],
      ...translatableEntries(content),
    ];
    const byGroup = new Map<string, Row[]>();
    for (const [path, english] of all) {
      const saved = entries[path];
      const seed = seedTranslation(lang, english);
      const status: Status =
        saved && saved.source === english ? "custom" : saved ? "outdated" : seed ? "builtin" : "missing";
      const key = path.split(".")[0];
      byGroup.set(key, [...(byGroup.get(key) ?? []), { path, english, saved, seed, status }]);
    }
    return [...byGroup.entries()];
  }, [content, entries, lang, metaTitle, metaDescription]);

  const rows = groups.flatMap(([, list]) => list);
  const done = rows.filter((row) => row.status === "custom" || row.status === "builtin").length;
  const todo = rows.filter((row) => row.status === "outdated" || row.status === "missing").length;

  const setText = (row: Row, text: string) => {
    const next = { ...entries };
    if (text.trim()) next[row.path] = { source: row.english, text };
    else delete next[row.path];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-foreground">
        <p className="flex items-center gap-2 font-semibold">
          <Languages className="h-4 w-4" /> {LANGUAGE_NAMES[lang]} — {done} of {rows.length} fields translated
          {todo > 0 && <span className="text-warning">· {todo} showing English</span>}
        </p>
        <p className="mt-1 text-muted-foreground">
          Layout, links, photos and which sections are visible come from the English page; only the text changes
          here. Keep headings and buttons about as short as the English so they fit the same space. Leave a field
          empty to use the built-in translation (or English if there is none). If you edit the English later, the
          field is marked <em>English changed</em> and shows English until you translate it again.
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-foreground">
          <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} />
          Only show fields that still need a translation
        </label>
      </div>

      {groups.map(([key, list]) => {
        const visible = onlyTodo ? list.filter((row) => row.status === "outdated" || row.status === "missing") : list;
        if (visible.length === 0) return null;
        const pending = list.filter((row) => row.status === "outdated" || row.status === "missing").length;
        return (
          <SectionCard
            key={key}
            icon={key === "meta" ? FileText : Globe2}
            title={GROUP_TITLES[key] ?? key}
            hint={pending ? `${pending} of ${list.length} fields show English` : `All ${list.length} fields translated`}
            open={!!open[key]}
            onToggle={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
          >
            <div className="divide-y divide-border">
              {visible.map((row) => {
                const long = row.english.length > 80;
                const value = row.saved && row.status === "custom" ? row.saved.text : "";
                const placeholder = row.seed ?? row.english;
                const badge = STATUS_LABEL[row.status];
                return (
                  <div key={row.path} className="grid grid-cols-1 gap-2 py-3 md:grid-cols-2 md:gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{fieldName(row.path) || GROUP_TITLES[key]}</span>
                        <span className={`rounded px-1.5 py-0.5 ${badge.cls}`}>{badge.text}</span>
                      </div>
                      <p className="whitespace-pre-line text-sm text-foreground-light">{row.english}</p>
                      {row.status === "outdated" && row.saved && (
                        <p className="text-xs text-warning">
                          Old translation (of “{row.saved.source}”): {row.saved.text}
                        </p>
                      )}
                    </div>
                    {long ? (
                      <textarea
                        lang={lang}
                        rows={Math.min(8, Math.ceil(row.english.length / 70) + 1)}
                        className={textareaCls}
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => setText(row, e.target.value)}
                      />
                    ) : (
                      <input
                        lang={lang}
                        className={inputCls}
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => setText(row, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
