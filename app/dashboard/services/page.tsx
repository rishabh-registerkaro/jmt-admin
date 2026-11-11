"use client";

import { useState, useEffect } from "react";
import { Trash2, FilePenLine, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Author {
  _id: string;
  username: string;
}

interface Service {
  _id: string;
  slug: string;
  metaTitle?: string;
  template?: string;
  /** Derived server-side from the page content — the list never carries the full JSON */
  title?: string;
  author: Author;
  status: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const serviceTitle = (service: Service) => service.title || service.metaTitle || "";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    fetchServices(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServices = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/services?page=${page}&limit=10`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setServices(data.servicePages || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch services", { closeButton: true });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services", { closeButton: true });
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (slug: string) => {
    toast.warning("Are you sure you want to delete this service?", {
      description: "This action cannot be undone.",
      duration: 6000,
      className: "!bg-transparent !text-foreground !border-border",
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/services/${slug}`, {
              method: "DELETE",
              credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
              toast.success("Service deleted successfully!", {
                duration: 3000,
                className: "!bg-transparent !text-foreground !border-border",
              });
              fetchServices(pagination.currentPage);
            } else {
              toast.error(data.message || "Failed to delete service", {
                duration: 3000,
                className: "!bg-transparent !text-foreground !border-border",
              });
            }
          } catch (error) {
            console.error("Error deleting service:", error);
            toast.error("Failed to delete service");
          }
        },
      },
    });
  };

  const handleRevalidate = async (slug: string) => {
    const toastId = toast.loading("Revalidating cache...");
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["service-list", `service-${slug}`] }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cache cleared — frontend will fetch fresh content", { id: toastId });
      } else {
        toast.error(data.message || "Revalidation failed", { id: toastId });
      }
    } catch {
      toast.error("Revalidation failed", { id: toastId });
    }
  };

  // Filter services based on search and status
  const filteredServices = services.filter((service) => {
    const title = serviceTitle(service) || service.slug;
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Services</h1>
          <p className="text-sm text-muted-foreground">Manage your service pages</p>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border bg-card p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services..."
                className="w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border-strong bg-background text-foreground text-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button
              onClick={() => {
                window.location.href = "/dashboard/services/create-service";
              }}
              className="cursor-pointer whitespace-nowrap"
            >
              Add New Service
            </Button>
          </div>
        </div>

        {/* Services Table */}
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Title / Slug</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Author</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Last Modified</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="hover:bg-transparent"
                  >
                    <TableCell className="text-foreground-light">
                      <div className="h-5 bg-muted rounded animate-pulse w-3/4"></div>
                    </TableCell>
                    <TableCell className="text-foreground-light">
                      <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-muted rounded-full animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-center gap-2">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <TableRow
                    key={service._id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-foreground-light font-medium">
                      <div>
                        {serviceTitle(service) || "(no title)"}
                        {service.status === "draft" && (
                          <span className="ml-2 text-xs text-muted-foreground">- Draft</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">/{service.slug}</div>
                    </TableCell>
                    <TableCell className="text-foreground-light">
                      {service.author?.username || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.status === "published"
                            ? "border border-brand/30 bg-brand/10 text-brand-link"
                            : "border border-warning/30 bg-warning/10 text-warning"
                        }`}
                      >
                        {service.status === "published" ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {service.updatedAt
                        ? formatDate(service.updatedAt)
                        : service.createdAt
                        ? formatDate(service.createdAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/dashboard/services/update-service?slug=${service.slug}`;
                          }}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </Button>
                        {service.status === "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevalidate(service.slug)}
                            title="Clear frontend cache for this service"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.slug)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No services found. Create your first service using the "Add New Service" button.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} •{" "}
                {pagination.totalCount} services
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => fetchServices(pagination.currentPage - 1)}
                  className="disabled:opacity-40"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => fetchServices(pagination.currentPage + 1)}
                  className="disabled:opacity-40"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


