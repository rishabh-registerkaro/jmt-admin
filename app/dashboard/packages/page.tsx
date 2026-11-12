"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  FilePenLine,
  RefreshCw,
  MoreVertical,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface PackageBlock {
  _id: string;
  slug: string;
  title?: string;
  /** Page slugs this block is injected into */
  targetPages?: string[];
  /** Derived server-side — the list never carries the full content JSON */
  tabCount?: number;
  packageCount?: number;
  author: Author;
  status: "draft" | "published";
  /** Frontend on/off switch, independent of status */
  visible?: boolean;
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

export default function PackagesPage() {
  const [blocks, setBlocks] = useState<PackageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  /** Slug of the block whose visibility is mid-flight, to disable its switch */
  /** Slug being duplicated, so the row's menu can show progress */
  const [duplicatingSlug, setDuplicatingSlug] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchBlocks = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/packages?page=${page}&limit=10`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setBlocks(data.packageBlocks || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch package blocks", { closeButton: true });
      }
    } catch (error) {
      console.error("Error fetching package blocks:", error);
      toast.error("Failed to fetch package blocks", { closeButton: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks(1);
  }, [fetchBlocks]);

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
    toast.warning("Are you sure you want to delete this package block?", {
      description: "It will be removed from every page it appears on. This cannot be undone.",
      duration: 6000,
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/packages/${slug}`, {
              method: "DELETE",
              credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
              toast.success("Package block deleted successfully!", {
                duration: 3000,
              });
              fetchBlocks(pagination.currentPage);
            } else {
              toast.error(data.message || "Failed to delete package block", {
                duration: 3000,
              });
            }
          } catch (error) {
            console.error("Error deleting package block:", error);
            toast.error("Failed to delete package block");
          }
        },
      },
    });
  };

  // Copy a whole block — tabs, packages, wording, target pages — into a new
  // draft, so a near-identical block never has to be rebuilt from scratch.
  // The copy is always a draft, so nothing changes on the live site.
  const handleDuplicate = async (block: PackageBlock) => {
    if (duplicatingSlug) return;
    setDuplicatingSlug(block.slug);
    const toastId = toast.loading("Duplicating block...");
    try {
      const res = await fetch(`/api/packages/${block.slug}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Duplicated as a draft", {
          id: toastId,
          description:
            "Review the title and target pages before publishing — the copy targets the same pages as the original.",
          duration: 6000,
          closeButton: true,
        });
        // A "Published" filter would hide the new draft, making the click look
        // like it did nothing — widen it so the copy is actually visible.
        if (statusFilter === "published") setStatusFilter("");
        // The copy is the newest row, so it lands at the top of page 1
        fetchBlocks(1);
      } else {
        toast.error(data.message || "Failed to duplicate block", { id: toastId });
      }
    } catch (error) {
      console.error("Error duplicating package block:", error);
      toast.error("Failed to duplicate block", { id: toastId });
    } finally {
      setDuplicatingSlug(null);
    }
  };

  const handleRevalidate = async (targetPages: string[] = []) => {
    const toastId = toast.loading("Revalidating cache...");
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: ["package-list", ...targetPages.map((p) => `packages-${p}`)],
        }),
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

  const filteredBlocks = blocks.filter((block) => {
    const haystack = `${block.title ?? ""} ${block.slug} ${(block.targetPages ?? []).join(" ")}`;
    const matchesSearch = haystack.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || block.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Packages</h1>
          <p className="text-sm text-muted-foreground">
            Package blocks are injected into the pages you target — they appear after the
            2nd content section of each page.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border bg-card p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, slug or target page..."
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
                window.location.href = "/dashboard/packages/create-package";
              }}
              className="cursor-pointer whitespace-nowrap"
            >
              Add New Block
            </Button>
          </div>
        </div>

        {/* Blocks Table */}
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Title / Slug</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Appears on</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Packages</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Last Modified</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="hover:bg-transparent"
                  >
                    <TableCell>
                      <div className="h-5 bg-muted rounded animate-pulse w-3/4"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-12"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-muted rounded-full animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 bg-muted rounded-full animate-pulse w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBlocks.length > 0 ? (
                filteredBlocks.map((block) => {
                  const targets = block.targetPages ?? [];
                  return (
                    <TableRow
                      key={block._id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="text-foreground-light font-medium">
                        <div>
                          {block.title || "(no title)"}
                          {block.status === "draft" && (
                            <span className="ml-2 text-xs text-muted-foreground">- Draft</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{block.slug}</div>
                      </TableCell>
                      <TableCell>
                        {targets.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {targets.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs bg-muted/50 text-foreground-light"
                              >
                                /{p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-warning">No target pages</span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground-light text-sm">
                        {block.packageCount ?? 0}
                        <span className="text-muted-foreground">
                          {" "}
                          in {block.tabCount ?? 0} tab{block.tabCount === 1 ? "" : "s"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            block.status === "published"
                              ? "border border-brand/30 bg-brand/10 text-brand-link"
                              : "border border-warning/30 bg-warning/10 text-warning"
                          }`}
                        >
                          {block.status === "published" ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {block.updatedAt
                          ? formatDate(block.updatedAt)
                          : block.createdAt
                          ? formatDate(block.createdAt)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Actions"
                                aria-label={`Actions for ${block.title || block.slug}`}
                                className="cursor-pointer"
                              >
                                {duplicatingSlug === block.slug ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/dashboard/packages/update-package?slug=${block.slug}`;
                                }}
                                className="cursor-pointer"
                              >
                                <FilePenLine className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={duplicatingSlug !== null}
                                onClick={() => handleDuplicate(block)}
                                className="cursor-pointer"
                              >
                                <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                                Duplicate
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                  as draft
                                </span>
                              </DropdownMenuItem>

                              {block.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() => handleRevalidate(targets)}
                                  className="cursor-pointer"
                                >
                                  <RefreshCw className="mr-2 h-4 w-4 text-warning" />
                                  Clear frontend cache
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(block.slug)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No package blocks found. Create your first one using the &quot;Add New
                    Block&quot; button.
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
                {pagination.totalCount} blocks
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => fetchBlocks(pagination.currentPage - 1)}
                  className="disabled:opacity-40"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => fetchBlocks(pagination.currentPage + 1)}
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
