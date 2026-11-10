"use client";

import { useEffect, useState } from "react";
import { Edit, Plus, Trash2, Search, View, ChevronLeft, ChevronRight } from "lucide-react";
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
      
      const res = await fetch(`/api/lead?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.leads) {
        setLeads(data.leads);
        setFilteredLeads(data.leads);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toast.error(data.message || "Failed to fetch leads", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    fetchLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "converted":
        return "bg-green-500/20 text-green-400";
      case "contacted":
        return "bg-blue-500/20 text-blue-400";
      case "lost":
        return "bg-red-500/20 text-red-400";
      case "new":
      default:
        return "bg-yellow-500/20 text-yellow-400";
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
      className: "!bg-transparent !text-white",
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const loadingToastId = toast.loading("Deleting lead...", {
              closeButton: true,
              className: "!bg-transparent !text-white",
            });

            const res = await fetch(`/api/lead/${leadId}`, {
              method: "DELETE",
            });

            toast.dismiss(loadingToastId);

            if (res.ok) {
              toast.success("Lead deleted successfully!", {
                closeButton: true,
                className: "!bg-transparent !text-white",
              });
              fetchLeads(); // Refresh the list
            } else {
              const data = await res.json();
              toast.error(data.message || "Failed to delete lead", {
                closeButton: true,
                className: "!bg-transparent !text-white",
              });
            }
          } catch (error) {
            toast.error("Failed to delete lead", {
              closeButton: true,
              className: "!bg-transparent !text-white",
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
    <div className="min-h-screen w-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
          <p className="text-slate-400">Manage your incoming leads</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads by name, email, phone, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => setStatus(value as any)}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-slate-600 bg-slate-900/60 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600 text-white">
              <SelectItem value="all" className="hover:bg-slate-800">
                All Status
              </SelectItem>
              <SelectItem value="new" className="hover:bg-slate-800">
                New
              </SelectItem>
              <SelectItem value="contacted" className="hover:bg-slate-800">
                Contacted
              </SelectItem>
              <SelectItem value="converted" className="hover:bg-slate-800">
                Converted
              </SelectItem>
              <SelectItem value="lost" className="hover:bg-slate-800">
                Lost
              </SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-slate-900 text-white sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Lead</DialogTitle>
                <DialogDescription className="text-slate-400">
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

        {/* Leads Table */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-300">Name/Email</TableHead>
                <TableHead className="text-slate-300">Phone</TableHead>
                <TableHead className="text-slate-300">Topic</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Source</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="border-slate-700 hover:bg-transparent"
                  >
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-28"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-slate-700 rounded-full animate-pulse w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-28"></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead._id}
                    className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="text-slate-200 font-medium">
                      <div className="flex flex-col">
                        <span className="text-slate-200 text-sm font-medium">
                          {lead.name}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">
                          {lead.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {lead.phoneNo}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {Object.values(lead.formData ?? {})[0] || "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status.charAt(0).toUpperCase() +
                          lead.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {lead.leadSource || "Website"}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setViewLead(lead);
                            setEditLead(null);
                            setDrawerOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                        >
                          <View className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditLead(lead);
                            setViewLead(null);
                            setDrawerOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lead._id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-slate-400"
                  >
                    {search || status !== "all"
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
            className="bg-slate-900 w-[420px] text-white"
          >
            {/* VIEW MODE */}
            {viewLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-white text-2xl">
                    View Lead
                  </SheetTitle>
                  <SheetDescription className="text-slate-400">
                    Lead details
                  </SheetDescription>
                </SheetHeader>

                <ViewLead lead={viewLead} />
              </>
            )}
            {editLead && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-white text-2xl">
                    Edit Lead
                  </SheetTitle>
                  <SheetDescription className="text-slate-400">
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
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount} leads
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLeads(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
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
                          ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                          : "border-slate-600 text-slate-300 hover:bg-slate-800"
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
                className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredLeads.length > 0 && (
          <div className="text-sm text-slate-400">
            Showing {filteredLeads.length} of {pagination.totalCount} leads
            {search && " (filtered by search)"}
          </div>
        )}
      </div>
    </div>
  );
}
