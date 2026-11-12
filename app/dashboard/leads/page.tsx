"use client";

import { useEffect, useState } from "react";
import { Edit, Plus, Trash2, Search, View, ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Lead } from "@/app/types/lead";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EditLeadForm from "@/components/common/EditLeadForm";
import ViewLead from "@/components/common/ViewLead";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddLeadForm from "@/components/common/AddLead";

type LeadStatus = Lead["status"];
const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "lost"];

interface SourceOption {
  source: string;
  count: number;
}

/** First form answer as the lead's topic, and the remaining answers as "Label: value". */
function splitFormData(formData: Lead["formData"]) {
  const entries = Object.entries(formData ?? {}).filter(([, v]) => String(v ?? "").trim() !== "");
  const [first, ...rest] = entries;
  return {
    topic: first ? String(first[1]) : "",
    topicLabel: first ? first[0] : "",
    details: rest.map(([k, v]) => `${k}: ${v}`),
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<
    "all" | "new" | "contacted" | "converted" | "lost"
  >("all");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const router = useRouter();

  const fetchLeads = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      
      if (status !== "all") {
        params.append("status", status);
      }
      if (sourceFilter !== "all") {
        params.append("source", sourceFilter);
      }
      
      const res = await fetch(`/api/lead?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.leads) {
        setLeads(data.leads);
        setFilteredLeads(data.leads);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        if (Array.isArray(data.sources)) {
          setSources(data.sources);
        }
      } else {
        toast.error(data.message || "Failed to fetch leads", {
          closeButton: true,
          className: "!bg-transparent !text-foreground",
        });
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads", {
        closeButton: true,
        className: "!bg-transparent !text-foreground",
      });
    } finally {
      setLoading(false);
    }
  };

  // Runs on mount and whenever a filter changes.
  useEffect(() => {
    fetchLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sourceFilter]);

  // Filter leads based on search and status
  useEffect(() => {
    let filtered = leads;

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter((lead) => lead.status === status);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          lead.phoneNo.toLowerCase().includes(searchLower) ||
          (lead.leadSource &&
            lead.leadSource.toLowerCase().includes(searchLower)) ||
          Object.values(lead.formData ?? {}).some((v) =>
            String(v).toLowerCase().includes(searchLower)
          )
      );
    }

    setFilteredLeads(filtered);
  }, [leads, status, search]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** Two short lines for the Created column: "Today" / "12 Nov 2026" and the time. */
  const formatDateParts = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const day = sameDay(date, now)
      ? "Today"
      : sameDay(date, yesterday)
        ? "Yesterday"
        : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return { day, time };
  };

  /** Inline status change from the table; reverts if the save fails. */
  const handleStatusChange = async (lead: Lead, next: LeadStatus) => {
    if (next === lead.status) return;
    const previous = lead.status;
    const apply = (value: LeadStatus) =>
      setLeads((all) => all.map((l) => (l._id === lead._id ? { ...l, status: value } : l)));
    apply(next);
    setUpdatingId(lead._id);
    try {
      const res = await fetch(`/api/lead/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
      }
      toast.success(`Marked as ${next.charAt(0).toUpperCase() + next.slice(1)}`);
      // Under a status filter the lead no longer belongs on this page.
      if (status !== "all") fetchLeads(pagination.currentPage);
    } catch (error) {
      apply(previous);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openView = (lead: Lead) => {
    setViewLead(lead);
    setEditLead(null);
    setDrawerOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "converted":
        return "border border-brand/30 bg-brand/10 text-brand-link";
      case "contacted":
        return "border bg-secondary text-foreground-light";
      case "lost":
        return "border border-destructive/30 bg-destructive/10 text-destructive";
      case "new":
      default:
        return "border border-warning/30 bg-warning/10 text-warning";
    }
  };

  const handleCreateLead = async (lead: any) => {
    try {
      const toastId = toast.loading("Creating lead...");

      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lead),
      });

      toast.dismiss(toastId);

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Failed to create lead");
        return;
      }

      toast.success("Lead created successfully!");
      fetchLeads(); // refresh list
    } catch (err) {
      toast.error("Error creating lead");
      console.error(err);
    }
  };

  const handleDelete = async (leadId: string) => {
    toast.warning("Are you sure you want to delete this lead?", {
      description: "This action cannot be undone.",
      duration: 6000,
      className: "!bg-transparent !text-foreground",
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const loadingToastId = toast.loading("Deleting lead...", {
              closeButton: true,
              className: "!bg-transparent !text-foreground",
            });

            const res = await fetch(`/api/lead/${leadId}`, {
              method: "DELETE",
            });

            toast.dismiss(loadingToastId);

            if (res.ok) {
              toast.success("Lead deleted successfully!", {
                closeButton: true,
                className: "!bg-transparent !text-foreground",
              });
              fetchLeads(); // Refresh the list
            } else {
              const data = await res.json();
              toast.error(data.message || "Failed to delete lead", {
                closeButton: true,
                className: "!bg-transparent !text-foreground",
              });
            }
          } catch (error) {
            toast.error("Failed to delete lead", {
              closeButton: true,
              className: "!bg-transparent !text-foreground",
            });
          }
        },
      },
    });
  };

  const handleUpdatedLead = async (updatedLead: Lead) => {
    try {
      const toastId = toast.loading("Updating lead...");
      const res = await fetch(`/api/lead/${updatedLead._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedLead),
      });

      toast.dismiss(toastId);

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to update lead");
        return;
      }

      const data = await res.json();
      setDrawerOpen(false);
      fetchLeads();

      toast.success("Lead updated successfully!");
    } catch (error) {
      toast.error("Error updating lead");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage your incoming leads</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, phone, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => setStatus(value as any)}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="">
              <SelectItem value="all" className="">
                All Status
              </SelectItem>
              <SelectItem value="new" className="">
                New
              </SelectItem>
              <SelectItem value="contacted" className="">
                Contacted
              </SelectItem>
              <SelectItem value="converted" className="">
                Converted
              </SelectItem>
              <SelectItem value="lost" className="">
                Lost
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[220px] rounded-lg border" title={sourceFilter === "all" ? undefined : sourceFilter}>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="max-w-[min(90vw,420px)]">
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map(({ source, count }) => (
                <SelectItem key={source} value={source}>
                  <span className="truncate">{source}</span>
                  <span className="ml-1 text-muted-foreground">({count})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Lead</DialogTitle>
                <DialogDescription className="">
                  Enter lead details and save.
                </DialogDescription>
              </DialogHeader>

              <AddLeadForm
                onCreate={async (lead) => {
                  await handleCreateLead(lead);
                  setShowAddDialog(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Leads Table — 5 columns with capped widths so it fits without
            sideways scrolling; Actions stays pinned right if the screen is narrow. */}
        <div className="rounded-lg border bg-card p-2 sm:p-4">
          <Table className="min-w-[760px] table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col />
              <col className="w-[132px]" />
              <col className="w-[112px]" />
              <col className="w-[116px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Lead</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Topic / Source</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Created</TableHead>
                <TableHead className="sticky right-0 z-10 bg-card text-xs font-medium text-muted-foreground text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-28 mb-2"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-48"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-7 bg-muted rounded animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-16 mb-2"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-12"></div>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-card">
                      <div className="flex justify-center gap-2">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const { topic, topicLabel, details } = splitFormData(lead.formData);
                  const source = lead.leadSource || "Website";
                  const { day, time } = formatDateParts(lead.createdAt);
                  return (
                    <TableRow
                      key={lead._id}
                      onClick={() => openView(lead)}
                      className="group cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      {/* Lead: name, email, phone */}
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-sm font-medium text-foreground-light" title={lead.name}>
                            {lead.name}
                          </span>
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                              title={lead.email}
                            >
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                          )}
                          {lead.phoneNo && (
                            <a
                              href={`tel:${lead.phoneNo}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                              title={`Call ${lead.phoneNo}`}
                            >
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.phoneNo}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Topic (first form answer), the other answers, then the source page */}
                      <TableCell className="align-top whitespace-normal">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className="line-clamp-2 break-words text-sm text-foreground-light"
                            title={topic ? `${topicLabel}: ${topic}` : undefined}
                          >
                            {topic || <span className="text-muted-foreground">—</span>}
                          </span>
                          {details.length > 0 && (
                            <span
                              className="line-clamp-2 break-words text-xs text-muted-foreground"
                              title={details.join("\n")}
                            >
                              {details.join(" · ")}
                            </span>
                          )}
                          <span
                            className="line-clamp-2 break-words text-xs italic text-muted-foreground/80"
                            title={source}
                          >
                            {source}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status: change it right here */}
                      <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => handleStatusChange(lead, value as LeadStatus)}
                          disabled={updatingId === lead._id}
                        >
                          <SelectTrigger
                            className={`!h-7 w-[118px] rounded-full px-2.5 text-xs font-medium ${getStatusColor(lead.status)}`}
                            aria-label={`Status for ${lead.name}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Created: short date + time, full timestamp on hover */}
                      <TableCell className="align-top whitespace-nowrap" title={formatDate(lead.createdAt)}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-foreground-light">{day}</span>
                          <span className="text-xs text-muted-foreground">{time}</span>
                        </div>
                      </TableCell>

                      {/* Actions: pinned to the right edge */}
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
                            aria-label="View lead"
                            onClick={() => openView(lead)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <View className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Edit"
                            aria-label="Edit lead"
                            onClick={() => {
                              setEditLead(lead);
                              setViewLead(null);
                              setDrawerOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            aria-label="Delete lead"
                            onClick={() => handleDelete(lead._id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {search || status !== "all" || sourceFilter !== "all"
                      ? "No leads found matching your filters"
                      : "No leads found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Sheet
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (!open) {
              setEditLead(null);
              setViewLead(null);
            }
          }}
        >
          <SheetContent
            side="right"
            className="w-full sm:w-[420px] overflow-y-auto"
          >
            {/* VIEW MODE */}
            {viewLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl">
                    View Lead
                  </SheetTitle>
                  <SheetDescription className="">
                    Lead details
                  </SheetDescription>
                </SheetHeader>

                <ViewLead lead={viewLead} />
              </>
            )}
            {editLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl">
                    Edit Lead
                  </SheetTitle>
                  <SheetDescription className="">
                    Update the lead and save.
                  </SheetDescription>
                </SheetHeader>

                <EditLeadForm lead={editLead} onSave={handleUpdatedLead} />
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount} leads
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLeads(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchLeads(pageNum)}
                      className={
                        pagination.currentPage === pageNum
                          ? ""
                          : ""
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLeads(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredLeads.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredLeads.length} of {pagination.totalCount} leads
            {search && " (filtered by search)"}
          </div>
        )}
      </div>
    </div>
  );
}
