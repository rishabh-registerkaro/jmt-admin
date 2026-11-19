"use client";

// Join Our Crew worker applications (jmt-frontend /join-our-crew → /api/lead/join).
// Stored as leads with the Join Our Crew source; listed here instead of on the
// Leads page. applications.view opens the page, applications.manage changes
// status and deletes.

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, MessageCircle, Paperclip, Phone, Search, Trash2, View } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermissions } from "@/components/common/PermissionsProvider";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { JOIN_TRADES } from "@/utils/joinForm";
import type { Lead } from "@/app/types/lead";
import { DOCUMENTS_KEY, applicationDocumentUrl, readApplicationDocuments } from "@/app/lib/utils/applicationDocuments";

type Status = Lead["status"];
const STATUSES: Status[] = ["new", "contacted", "converted", "lost"];

/** Hiring wording for the shared lead statuses. */
const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Hired",
  lost: "Rejected",
};

const STATUS_CLASS: Record<Status, string> = {
  new: "border border-warning/30 bg-warning/10 text-warning",
  contacted: "border bg-secondary text-foreground-light",
  converted: "border border-brand/30 bg-brand/10 text-brand-link",
  lost: "border border-destructive/30 bg-destructive/10 text-destructive",
};

// formData keys written by app/api/lead/join/route.ts
const F = {
  trade: "Trade",
  experience: "Experience",
  location: "District or town",
  languages: "Languages",
  start: "Can start",
  whyHire: "Why hire",
  documents: DOCUMENTS_KEY,
} as const;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const EMPTY_PAGINATION: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
};

function field(a: Lead, key: string): string {
  return String(a.formData?.[key] ?? "").trim();
}

/** wa.me needs digits only, with country code; bare 10-digit Indian numbers get 91. */
function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}`;
}

function formatDateParts(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = same(date, now)
    ? "Today"
    : same(date, yesterday)
      ? "Yesterday"
      : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { day, time };
}

export default function ApplicationsPage() {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.APPLICATIONS_MANAGE);

  const [applications, setApplications] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | Status>("all");
  const [trade, setTrade] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusCounts, setStatusCounts] = useState<Partial<Record<Status, number>>>({});
  const [pagination, setPagination] = useState<PaginationInfo>(EMPTY_PAGINATION);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchApplications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "10" });
        if (status !== "all") params.set("status", status);
        if (trade !== "all") params.set("trade", trade);
        if (search) params.set("search", search);
        const res = await fetch(`/api/applications?${params}`);
        const data = await res.json();
        if (data.success) {
          setApplications(data.applications ?? []);
          setPagination(data.pagination ?? EMPTY_PAGINATION);
          setStatusCounts(data.statusCounts ?? {});
        } else {
          toast.error(data.message || "Failed to load applications");
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    },
    [status, trade, search],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/filter change; the fetcher sets state
    fetchApplications(1);
  }, [fetchApplications]);

  // Search as you type, debounced.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const changeStatus = async (app: Lead, next: Status) => {
    if (next === app.status) return;
    setUpdatingId(app._id);
    const prev = app.status;
    setApplications((list) => list.map((a) => (a._id === app._id ? { ...a, status: next } : a)));
    try {
      const res = await fetch(`/api/applications/${app._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status");
      toast.success(`${app.name} marked as ${STATUS_LABEL[next]}`);
      setStatusCounts((c) => ({ ...c, [prev]: Math.max(0, (c[prev] ?? 1) - 1), [next]: (c[next] ?? 0) + 1 }));
      setViewing((v) => (v && v._id === app._id ? { ...v, status: next } : v));
    } catch (error) {
      setApplications((list) => list.map((a) => (a._id === app._id ? { ...a, status: prev } : a)));
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${toDelete._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete application");
      toast.success("Application deleted");
      if (viewing?._id === toDelete._id) setViewing(null);
      setToDelete(null);
      const page =
        applications.length === 1 && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
      fetchApplications(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete application");
    } finally {
      setDeleting(false);
    }
  };

  const totalAll = STATUSES.reduce((n, s) => n + (statusCounts[s] ?? 0), 0);
  const filtersActive = status !== "all" || trade !== "all" || !!search;

  const renderStatus = (app: Lead) =>
    canManage ? (
      <Select
        value={app.status}
        onValueChange={(v) => changeStatus(app, v as Status)}
        disabled={updatingId === app._id}
      >
        <SelectTrigger
          className={`!h-7 w-[118px] rounded-full px-2.5 text-xs font-medium ${STATUS_CLASS[app.status]}`}
          aria-label={`Status for ${app.name}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium ${STATUS_CLASS[app.status]}`}>
        {STATUS_LABEL[app.status]}
      </span>
    );

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Workers who applied through the Join Our Crew page
          </p>
        </div>

        {/* Status tabs with counts */}
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => {
            const active = status === s;
            const count = s === "all" ? totalAll : statusCounts[s] ?? 0;
            return (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setStatus(s)}
                className="rounded-full"
              >
                {s === "all" ? "All" : STATUS_LABEL[s]}
                <span className={`ml-1.5 tabular-nums ${active ? "" : "text-muted-foreground"}`}>{count}</span>
              </Button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full rounded-lg border"
            />
          </div>
          <Select value={trade} onValueChange={setTrade}>
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filter by trade">
              <SelectValue placeholder="All trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trades</SelectItem>
              {JOIN_TRADES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card p-2 sm:p-4 overflow-x-auto">
          {/* Fixed layout: one <col> per column (7), so long values truncate inside
              their own column instead of spilling into the next one. */}
          <Table className="min-w-[1040px] table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[15%]" />
              <col />
              <col className="w-[17%]" />
              <col className="w-[140px]" />
              <col className="w-[116px]" />
              <col className="w-[96px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Applicant</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Trade / Experience</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground whitespace-normal">Location / Languages / Start</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Documents</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Applied</TableHead>
                <TableHead className="sticky right-0 z-10 bg-card text-xs font-medium text-muted-foreground text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted rounded animate-pulse w-24 mb-2" />
                        <div className="h-3 bg-muted rounded animate-pulse w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : applications.length > 0 ? (
                applications.map((app) => {
                  const { day, time } = formatDateParts(app.createdAt);
                  const location = field(app, F.location);
                  const languages = field(app, F.languages);
                  const start = field(app, F.start);
                  const documents = readApplicationDocuments(app.formData);
                  return (
                    <TableRow
                      key={app._id}
                      onClick={() => setViewing(app)}
                      className="group cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-sm font-medium text-foreground-light" title={app.name}>
                            {app.name}
                          </span>
                          <a
                            href={`tel:${app.phoneNo}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" /> {app.phoneNo}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-sm text-foreground-light" title={field(app, F.trade)}>
                            {field(app, F.trade) || "—"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">{field(app, F.experience) || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <span className="text-sm text-foreground-light truncate" title={location}>
                            {location || "—"}
                          </span>
                          <span className="truncate" title={[languages, start && `Can start: ${start}`].filter(Boolean).join(" · ")}>
                            {[languages, start && `Can start: ${start}`].filter(Boolean).join(" · ") || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-normal" onClick={(e) => e.stopPropagation()}>
                        {documents.length > 0 ? (
                          <div className="flex min-w-0 flex-col gap-1">
                            {documents.map((doc) => (
                              <a
                                key={doc.key}
                                href={applicationDocumentUrl(app._id, doc.key)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${doc.name} (${formatSize(doc.bytes)})`}
                                className="inline-flex min-w-0 items-center gap-1.5 text-sm text-foreground-light hover:text-brand-link hover:underline"
                              >
                                <Paperclip className="h-3.5 w-3.5 flex-none text-muted-foreground" aria-hidden="true" />
                                <span className="truncate">{doc.name}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No documents uploaded</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                        {renderStatus(app)}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-foreground-light">{day}</span>
                          <span className="text-xs text-muted-foreground">{time}</span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="sticky right-0 align-top bg-card group-hover:bg-muted transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="View"
                            aria-label="View application"
                            onClick={() => setViewing(app)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <View className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              aria-label="Delete application"
                              onClick={() => setToDelete(app)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {filtersActive ? "No applications match your filters" : "No applications yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}{" "}
              applications
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchApplications(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchApplications(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail drawer */}
        <Sheet open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
          <SheetContent side="right" className="w-full sm:w-[420px] overflow-y-auto">
            {viewing && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl">{viewing.name}</SheetTitle>
                  <SheetDescription>
                    Applied {new Date(viewing.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <a href={`tel:${viewing.phoneNo}`}>
                        <Phone className="h-4 w-4 mr-1.5" /> Call {viewing.phoneNo}
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={whatsappLink(viewing.phoneNo)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                      </a>
                    </Button>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                    {renderStatus(viewing)}
                  </div>

                  <dl className="divide-y border-y">
                    {[
                      ["Trade", field(viewing, F.trade)],
                      ["Experience", field(viewing, F.experience)],
                      ["District or town", field(viewing, F.location)],
                      ["Languages", field(viewing, F.languages)],
                      ["Can start", field(viewing, F.start)],
                      // Any other answers (older applications' "OK to call or WhatsApp", or a future field)
                      ...Object.entries(viewing.formData ?? {})
                        .filter(([k]) => !(Object.values(F) as string[]).includes(k))
                        .map(([k, v]) => [k, String(v ?? "")]),
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 py-3">
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="text-sm font-medium text-foreground text-right break-words">{value || "—"}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Why should we hire you?
                    </p>
                    <p className="whitespace-pre-line break-words text-sm text-foreground">
                      {field(viewing, F.whyHire) || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Documents</p>
                    {readApplicationDocuments(viewing.formData).length > 0 ? (
                      <ul className="space-y-2">
                        {readApplicationDocuments(viewing.formData).map((doc) => (
                          <li key={doc.key}>
                            <a
                              href={applicationDocumentUrl(viewing._id, doc.key)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                            >
                              <FileText className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{doc.name}</span>
                              <span className="flex-none text-xs text-muted-foreground">{formatSize(doc.bytes)}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => setToDelete(viewing)}>
                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete application
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete confirmation */}
        <Dialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete application?</DialogTitle>
              <DialogDescription>
                {toDelete ? `${toDelete.name}'s application will be removed permanently.` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setToDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
