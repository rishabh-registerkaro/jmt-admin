"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, UserPlus, Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteUser } from "@/lib/apiCallingUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { toApiError } from "@/app/dashboard/_lib/api-error";
import axios from "axios";
import ViewUser from "@/components/common/ViewUser";

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  role: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  // Current logged-in user info
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Delete user state (Super Admin only)
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isSuperAdmin = currentUserRole === "superadmin";
  const canDelete = (u: User) => isSuperAdmin && u.id !== currentUserId && u.role !== "superadmin";

  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (sortBy) {
        params.append("sortBy", sortBy);
      }

      if (sortOrder) {
        params.append("sortOrder", sortOrder);
      }

      const res = await axios.get(`/api/users?${params.toString()}`, {
        withCredentials: true,
      });
      const data = await res.data;
      console.log(data);
      if (data.success && data.users) {
        setUsers(data.users);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toast.error(data.message || "Failed to fetch users", {
          closeButton: true,
          className: "!bg-transparent !text-foreground",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users", {
        closeButton: true,
        className: "!bg-transparent !text-foreground",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingUser(true);
      const res = await axios.get(`/api/users/${userId}`, {
        withCredentials: true,
      });
      const data = await res.data;

      if (data.success && data.user) {
        setViewUser(data.user);
        setSheetOpen(true);
      } else {
        toast.error(data.message || "Failed to fetch user details", {
          closeButton: true,
          className: "!bg-transparent !text-foreground",
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details", {
        closeButton: true,
        className: "!bg-transparent !text-foreground",
      });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dependency change; the fetcher sets state
    fetchUsers(1);
    axios.get("/api/auth/profile", { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setCurrentUserRole(res.data.user.role);
          setCurrentUserId(res.data.user.id);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset to page 1 when search or sort changes
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dependency change; the fetcher sets state
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortOrder]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const res = await axios.post("/api/users", createForm, { withCredentials: true });
      if (res.data.success) {
        toast.success("User created successfully", { closeButton: true, className: "!bg-transparent !text-foreground" });
        setCreateDialogOpen(false);
        setCreateForm({ username: "", email: "", password: "", role: "" });
        fetchUsers(1);
      }
    } catch (error) {
      const msg = toApiError(error).response?.data?.message || "Failed to create user";
      toast.error(msg, { closeButton: true, className: "!bg-transparent !text-foreground" });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    const res = await deleteUser(userToDelete.id);
    setDeleteLoading(false);
    if (res.success) {
      toast.success(`${userToDelete.username} was deleted`, { closeButton: true, className: "!bg-transparent !text-foreground" });
      if (viewUser?.id === userToDelete.id) {
        setSheetOpen(false);
        setViewUser(null);
      }
      setUserToDelete(null);
      // Step back a page if we just removed the last row on this page
      const page = users.length === 1 && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
      fetchUsers(page);
    } else {
      toast.error(res.message || "Failed to delete user", { closeButton: true, className: "!bg-transparent !text-foreground" });
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

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchUsers(1);
    }
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default desc order
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleViewUser = (userId: string) => {
    fetchUserDetails(userId);
  };


  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-brand/10 text-brand-link border-brand/30";
      case "admin":
        return "bg-secondary text-foreground border-border-strong";
      case "editor":
        return "bg-brand/10 text-brand-link border-brand/30";
      case "contributor":
        return "bg-warning/10 text-warning border-warning/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatRole = (role: string) => {
    if (!role) return "N/A";
    return role === "superadmin"
      ? "Super Admin"
      : role === "admin"
        ? "Admin"
        : role === "editor"
          ? "Editor"
          : role === "contributor"
            ? "Contributor"
            : "N/A";
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Users</h1>
            <p className="text-sm text-muted-foreground">Manage all system users</p>
          </div>
          {(currentUserRole === "superadmin" || currentUserRole === "admin") && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search users by username or email... (Press Enter)"
                className="pl-10 w-full"
              />
            </div>

            {/* Sort By Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="createdAt" className="cursor-pointer">
                  Created Date
                </SelectItem>
                <SelectItem value="username" className="cursor-pointer">
                  Username
                </SelectItem>
                <SelectItem value="email" className="cursor-pointer">
                  Email
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order Dropdown */}
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="desc" className="cursor-pointer">
                  Descending
                </SelectItem>
                <SelectItem value="asc" className="cursor-pointer">
                  Ascending
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Apply Search Button */}
            <Button
              onClick={() => fetchUsers(1)}
              className="cursor-pointer whitespace-nowrap"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSortChange("username")}>
                    Username
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSortChange("email")}>
                    Email
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSortChange("createdAt")}>
                    Created At
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Updated At</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Role</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
                )}
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
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <TableCell className="text-foreground-light font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-foreground-light">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.updatedAt)}
                      </TableCell>
                      <TableCell className="text-foreground-light">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role || "")}`}>
                          {formatRole(user.role || "")}
                        </span>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          {canDelete(user) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${user.username}`}
                              title="Delete user"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserToDelete(user);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={isSuperAdmin ? 6 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No users found matching your search"
                      : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} users
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(1)}
                  disabled={!pagination.hasPrevPage}
                  className="disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
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
                        onClick={() => fetchUsers(pageNum)}
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
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                  className="disabled:opacity-50"
                >
                  Last
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          {!loading && users.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {users.length} of {pagination.totalCount} users
              {search && " (filtered by search)"}
            </div>
          )}
        </div>

        {/* User Details Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            className="!max-w-[700px] !w-full overflow-y-auto"
          >
            {viewUser && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl">
                    User Details
                  </SheetTitle>
                  <SheetDescription className="">
                    Complete user information
                  </SheetDescription>
                </SheetHeader>

                {loadingUser ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading user details...</div>
                  </div>
                ) : (
                  <ViewUser
                    user={viewUser}
                    onRoleUpdate={() => fetchUsers(pagination.currentPage)}
                    onDeleteRequest={(u) => setUserToDelete(u as User)}
                  />
                )}
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete User Confirmation Dialog */}
        <Dialog
          open={!!userToDelete}
          onOpenChange={(open) => {
            if (!open && !deleteLoading) setUserToDelete(null);
          }}
        >
          <DialogContent className="border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Delete user?</DialogTitle>
              <DialogDescription>
                This permanently deletes{" "}
                <span className="font-semibold text-foreground">{userToDelete?.username}</span>{" "}
                ({userToDelete?.email}). Any posts or pages they authored will be reassigned to you.
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateForm({ username: "", email: "", password: "", role: "" });
        }}>
          <DialogContent className="border sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New User</DialogTitle>
              <DialogDescription className="">
                Fill in the details to create a new user account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="create-username" className="text-sm">Username</Label>
                <Input
                  id="create-username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="username"
                  required
                  className=""
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-email" className="text-sm">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                  className=""
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-role" className="text-sm">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(val) => setCreateForm((p) => ({ ...p, role: val }))}
                  required
                >
                  <SelectTrigger id="create-role" className="">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="">
                    {currentUserRole === "superadmin" && (
                      <SelectItem value="admin" className="text-foreground! cursor-pointer">Admin</SelectItem>
                    )}
                    <SelectItem value="editor" className="text-foreground! cursor-pointer">Editor</SelectItem>
                    <SelectItem value="contributor" className="text-foreground! cursor-pointer">Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}