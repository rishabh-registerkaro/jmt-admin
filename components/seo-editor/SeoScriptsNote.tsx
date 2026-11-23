// Shown in each page editor's SEO section: says what the section controls and
// links to the same page in Dashboard → SEO & Scripts (schema, GTM, scripts).
// The SEO & Scripts editor shows the reverse note (ScopeEditor).

import Link from "next/link";

export default function SeoScriptsNote({ path }: { path: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      This section sets the browser tab title, Google description and share previews. Schema (JSON-LD) and tracking
      scripts for this page are in{" "}
      <Link href={`/dashboard/seo?scope=${encodeURIComponent(path)}`} className="text-primary underline underline-offset-2">
        SEO &amp; Scripts
      </Link>
      .
    </p>
  );
}
