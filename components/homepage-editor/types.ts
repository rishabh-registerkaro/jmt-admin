import type { HomePageContent } from "@/app/lib/content/home-content";

/** Props every section editor takes: its slice of the document + a setter. */
export interface SectionEditorProps<K extends keyof HomePageContent> {
  value: HomePageContent[K];
  onChange: (value: HomePageContent[K]) => void;
}

/** Shallow-merge helper so editors can write `patch({ title })`. */
export function patcher<T extends object>(value: T, onChange: (value: T) => void) {
  return (patch: Partial<T>) => onChange({ ...value, ...patch });
}
