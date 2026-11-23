"use client";

// SEO & Scripts for the Joy Maa Tara site (jmt-frontend).
//   • Site-wide — Google Tag Manager, custom scripts and JSON-LD on every page
//   • Pages     — JSON-LD and scripts for one page (Home, About, each service…)
// Saved in `jmt_seo` (one row per scope) and served to the website by
// GET /api/seo/client; every save refreshes the website at once.
// ?scope=/about opens that page's editor directly.

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ScopeEditor, { type SeoEntry } from "@/components/seo-editor/ScopeEditor";
import { GLOBAL_SCOPE } from "@/app/lib/content/seo";

interface PageRow {
  scope: string;
  label: string;
  kind: "page" | "service" | "orphaned";
  draft?: boolean;
  schemaCount: number;
  scriptCount: number;
  updatedAt: string | null;
}

interface Overview {
  canSchemas: boolean;
  canScripts: boolean;
  global: SeoEntry;
  pages: PageRow[];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Loading failed");
  return data as T;
}

function SeoScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("scope");

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chosenTab, setChosenTab] = useState<"global" | "pages">("global");
  // Last page editor loaded; shown only while its scope is the selected one.
  const [loaded, setLoaded] = useState<SeoEntry | null>(null);
  const pageEntry = loaded && loaded.scope === selected ? loaded : null;
  const tab = selected && selected !== GLOBAL_SCOPE ? "pages" : chosenTab;

  const fetchOverview = useCallback(
    () =>
      getJson<Overview>("/api/seo").then(
        (data) => {
          setOverview(data);
          setLoadError(null);
        },
        (error: Error) => {
          setLoadError(error.message);
          toast.error(error.message, { closeButton: true });
        },
      ),
    [],
  );

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  // One page's editor (?scope=/about).
  useEffect(() => {
    if (!selected || selected === GLOBAL_SCOPE) return;
    let alive = true;
    getJson<SeoEntry>(`/api/seo/entry?scope=${encodeURIComponent(selected)}`).then(
      (entry) => alive && setLoaded(entry),
      (error: Error) => toast.error(error.message, { closeButton: true }),
    );
    return () => {
      alive = false;
    };
  }, [selected]);

  const openScope = (scope: string | null) => {
    router.push(scope ? `${pathname}?scope=${encodeURIComponent(scope)}` : pathname);
  };

  if (loadError && !overview) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-destructive">Could not load SEO settings: {loadError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { canSchemas, canScripts } = overview;
  const selectedRow = overview.pages.find((p) => p.scope === selected);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">SEO & Scripts</h1>
          <p className="text-sm text-muted-foreground">
            Google Tag Manager, custom scripts and structured data (JSON-LD) for the Joy Maa Tara website.
            {!canScripts && " Your role can edit schema only; tracking and scripts need the “Tracking & custom scripts” permission."}
          </p>
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex gap-1 border-b border-border">
          {(
            [
              ["global", "Site-wide"],
              ["pages", "Pages"],
            ] as const
          ).map(([key, title]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => {
                setChosenTab(key);
                if (selected) openScope(null);
              }}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === key ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {title}
            </button>
          ))}
        </div>

        {tab === "global" && (
          <ScopeEditor
            key="global"
            entry={overview.global}
            label="Site-wide"
            canSchemas={canSchemas}
            canScripts={canScripts}
            onSaved={(global) => setOverview((o) => (o ? { ...o, global } : o))}
          />
        )}

        {tab === "pages" && selected && (
          <div className="space-y-3">
            <Button variant="ghost" onClick={() => openScope(null)} className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> All pages
            </Button>
            {pageEntry ? (
              <ScopeEditor
                key={pageEntry.scope}
                entry={pageEntry}
                label={selectedRow?.label ?? pageEntry.scope}
                canSchemas={canSchemas}
                canScripts={canScripts}
                onSaved={(entry) => {
                  setLoaded(entry);
                  void fetchOverview();
                }}
              />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </div>
        )}

        {tab === "pages" && !selected && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="hidden sm:table-cell">Path</TableHead>
                  <TableHead className="text-center">Schema</TableHead>
                  <TableHead className="text-center">Scripts</TableHead>
                  <TableHead className="hidden md:table-cell">Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.pages.map((page) => (
                  <TableRow key={page.scope} className="cursor-pointer" onClick={() => openScope(page.scope)}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {page.label}
                        {page.kind === "service" && <Badge variant="secondary">Service</Badge>}
                        {page.draft && <Badge variant="warning">Draft</Badge>}
                        {page.kind === "orphaned" && (
                          <Badge variant="destructive" title="No page has this path any more. Clear it or keep it for later.">
                            No page
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{page.scope}</TableCell>
                    <TableCell className="text-center">{page.schemaCount || "—"}</TableCell>
                    <TableCell className="text-center">{page.scriptCount || "—"}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit SEO of ${page.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openScope(page.scope);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary to prerender.
export default function SeoPage() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-40" />}>
      <SeoScreen />
    </Suspense>
  );
}
