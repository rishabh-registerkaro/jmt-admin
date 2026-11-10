"use client";

import { useState, useEffect } from "react";
import { Trash2, FilePenLine, RefreshCw } from 'lucide-react';
import {getPosts, deletePost} from "@/lib/apiCalling"
import { getUsers } from "@/lib/apiCallingProfile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";

interface Author {
  _id: string;
  email: string;
  username: string;
}

interface Post {
  _id: string;
  title: string;
  slug?: string;
  author: Author;
  status: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface User {
  _id: string;
  id: string;
  username: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        if (data.success) {
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    loadUsers();
  }, []);

  // Fetch posts - only on page change, not on filter change
  useEffect(() => {
    fetchPosts();
  }, [pagination.page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Check if any filters are active
      const hasFilters = Boolean(
        (searchTerm && searchTerm.trim() !== "") ||
        (statusFilter && statusFilter !== "") ||
        (authorFilter && authorFilter !== "all" && authorFilter.trim() !== "")
      );

      let data;

      if (hasFilters) {
        // Use filter API when filters are active
        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
        });
        
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (statusFilter) params.set("status", statusFilter);
        if (authorFilter && authorFilter !== "all" && authorFilter.trim()) {
          params.set("author", authorFilter.trim());
        }

        const res = await axios.get(`/api/post/filter?${params.toString()}`, {
          withCredentials: true,
        });
        data = await res.data;
      } else {
        // Use default getPosts when no filters
        data = await getPosts(
          pagination.page,
          pagination.limit,
          statusFilter || undefined
        );
      }

      if (data?.success) {
        // Filter API returns data.data, getPosts returns data.posts
        setPosts((data.data || data.posts) as Post[] || []);
        setPagination((prev) => data.pagination || prev);
      } else {
        console.error("Failed to fetch posts:", data?.message);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async (slug: string) => {
    const toastId = toast.loading("Revalidating cache...");
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["post-list", `post-${slug}`] }),
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPosts();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };
 
  const handleDelete = async (postId: string) => {
    toast.warning("Are you sure you want to delete this post?", {
      description: "This action cannot be undone.",
      duration: 6000,
      className: "!bg-transparent !text-white !border-gray-200",
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const data = await deletePost(postId);

            if (data.success) {
              toast.success("Post deleted successfully!", {duration: 3000, className:"!bg-transparent !text-white !border-gray-200"});
              fetchPosts();
            } else {
              toast.error(data.message || "Failed to delete post", {duration: 3000, className:"!bg-transparent !text-white !border-gray-200"});
            }
          } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
          }
        },
      },
    });
  };
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Posts</h1>
          <p className="text-slate-400">Manage your blog posts</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mb-6">
          {/* First Row: Search Input (100% width) + Add New Post Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search posts... (Press Enter)"
                className="w-full bg-slate-900/60 text-white border-slate-600"
              />
            </div>
            <Button
              onClick={() => {
                window.location.href = "/dashboard/blog/create-blog";
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap" 
            >
              Add New Post
            </Button>
          </div>

          {/* Second Row: Author Dropdown + Status Dropdown + Apply Filters Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="bg-slate-900/60 text-white border-slate-600">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="all" className="!text-white focus:bg-slate-700 cursor-pointer">
                  All Authors
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id} className="!text-white focus:bg-slate-700 cursor-pointer">
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-900/60 text-white text-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button
              onClick={applyFilters}
              className="bg-slate-700 hover:bg-slate-600 text-white cursor-pointer whitespace-nowrap"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-300">Title</TableHead>
                <TableHead className="text-slate-300">Author</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Published / Last Modified</TableHead>
                <TableHead className="text-slate-300 text-center">Actions</TableHead>
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
                    <TableCell className="text-slate-200">
                      <div className="h-5 bg-slate-700 rounded animate-pulse w-3/4"></div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-20 mx-auto"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-slate-700 rounded-full animate-pulse w-24 mx-auto"></div>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      <div className="flex flex-col gap-1">
                        <div className="h-4 bg-slate-700 rounded animate-pulse w-32"></div>
                        <div className="h-3 bg-slate-700 rounded animate-pulse w-40"></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <TableRow
                    key={post._id}
                    className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="text-slate-200 font-medium">
                      {post.title || "(no title)"}
                      {post.status === "draft" && (
                        <span className="ml-2 text-xs text-slate-400">- Draft</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {post.author?.username || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === "published"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      <div className="flex flex-col gap-1">
                        {post.status === "published" && post.publishedAt ? (
                          <span>{formatDate(post.publishedAt)}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                        {post.updatedAt ? (
                          <span className="text-xs text-slate-500">
                            Modified: {formatDate(post.updatedAt)}
                          </span>
                        ) : post.createdAt ? (
                          <span className="text-xs text-slate-500">
                            Created: {formatDate(post.createdAt)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/dashboard/blog/update-blog?id=${post._id}`;
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 cursor-pointer"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </Button>
                        {post.status === "published" && post.slug && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevalidate(post.slug!)}
                            title="Clear frontend cache for this post"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/20 cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post._id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400 ">
                    No posts found. Create your first post using the "Add New Post" button.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} posts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="bg-slate-800 text-white border-slate-600 disabled:opacity-50"
                >
                  {"<<"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="bg-slate-800 text-white border-slate-600 disabled:opacity-50"
                >
                  {"<"}
                </Button>
                <span className="flex items-center px-4 text-slate-300 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-slate-800 text-white border-slate-600 disabled:opacity-50"
                >
                  {">"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-slate-800 text-white border-slate-600 disabled:opacity-50"
                >
                  {">>"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}