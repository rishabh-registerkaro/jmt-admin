"use client";

// Services — the JMT service pages: list, create, import built-in pages, delete.
// Each page is served by jmt-frontend at /service/<slug> (and /bn, /hi).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RevalidateButton } from "@/components/common/RevalidateButton";
import { jmtServiceTags } from "@/app/lib/utils/cacheTags";
import { Briefcase, Download, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inputCls, selectCls } from "@/components/homepage-editor/fields";
import { slugify } from "@/lib/service/normalizeServicePage";

const FRONTEND_URL = (process.env.NEXT_PUBLIC_JMT_FRONTEND_URL || "http://localhost:3002").replace(/\/+$/, "");

interface Row {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  updatedAt: string;
}
interface BuiltIn {
  slug: string;
  title: string;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `Request failed (${res.status})`);
  return data as T;
}

/** `startWithNewForm` opens the "new page" form straight away (Add New Service). */
export default function ServicesList({ startWithNewForm = false }: { startWithNewForm?: boolean }) {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [builtIn, setBuiltIn] = useState<BuiltIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(startWithNewForm);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [copyFrom, setCopyFrom] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ pages: Row[]; builtIn: BuiltIn[] }>("/api/jmt-services");
        setRows(data.pages);
        setBuiltIn(data.builtIn);
      } catch (error) {
        toast.error((error as Error).message, { closeButton: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadKey]);

  const create = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    try {
      const data = await api<{ page: Row }>("/api/jmt-services", { method: "POST", body: JSON.stringify(body) });
      toast.success(success);
      router.push(`/dashboard/services/${data.page.id}`);
    } catch (error) {
      toast.error((error as Error).message, { closeButton: true });
      setBusy(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create({ title, slug, status: "draft", ...(copyFrom ? { copyFrom } : {}) }, "Draft created");
  };

  // The built-in page goes live unchanged, so it is imported as published.
  const handleImport = (page: BuiltIn) =>
    create({ title: page.title, slug: page.slug, status: "published" }, `“${page.title}” imported — edit it below`);

  const handleDelete = async (row: Row) => {
    const builtInNote = row.slug === "site-service-supply" ? " The built-in version will show instead." : "";
    if (!window.confirm(`Delete “${row.title}”? /service/${row.slug} will stop showing this content.${builtInNote}`)) return;
    try {
      await api(`/api/jmt-services/${row.id}`, { method: "DELETE" });
      toast.success("Deleted");
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast.error((error as Error).message, { closeButton: true });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Briefcase className="h-6 w-6 text-muted-foreground" /> Services
            </h1>
            <p className="text-sm text-muted-foreground">
              Pages on the Joy Maa Tara site at /service/&lt;slug&gt;. Saving updates the live page within seconds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* jmt-service-list + up to 49 pages keeps the request under the 50-tag cap */}
            <RevalidateButton
              label="all service pages"
              tags={jmtServiceTags(...rows.filter((r) => r.status === "published").slice(0, 49).map((r) => r.slug))}
            />
            <Button onClick={() => setShowNew((v) => !v)}>
              <Plus className="mr-2 h-4 w-4" /> Add New Service
            </Button>
          </div>
        </div>

        {builtIn.map((page) => (
          <div
            key={page.slug}
            className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              <strong>{page.title}</strong> (/service/{page.slug}) is live with its built-in design content. Import it to
              edit it here.
            </p>
            <Button variant="outline" disabled={busy} onClick={() => handleImport(page)} className="shrink-0">
              <Download className="mr-2 h-4 w-4" /> Import to edit
            </Button>
          </div>
        ))}

        {showNew && (
          <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Page name</span>
                <input
                  className={inputCls}
                  required
                  value={title}
                  placeholder="Supervision and compliance"
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>URL slug</span>
                <input
                  className={inputCls}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                />
                <span className="block text-xs font-normal text-muted-foreground">/service/{slug || "…"}</span>
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">
              <span>Start from</span>
              <select className={selectCls} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                <option value="">The built-in design (Site labour supply content)</option>
                {rows.map((r) => (
                  <option key={r.id} value={r.slug}>
                    A copy of “{r.title}”
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-muted-foreground">The page is created as a draft — it goes live when you publish it.</p>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Creating..." : "Create draft"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No service pages in the CMS yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/dashboard/services/${row.id}`} className="hover:underline">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">/service/{row.slug}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === "published" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.status === "published" ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(row.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm" title="Edit">
                          <Link href={`/dashboard/services/${row.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {row.status === "published" && (
                          <RevalidateButton variant="row" label={`/service/${row.slug}`} tags={jmtServiceTags(row.slug)} />
                        )}
                        {row.status === "published" && (
                          <Button asChild variant="ghost" size="sm" title="View live">
                            <a href={`${FRONTEND_URL}/service/${row.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
