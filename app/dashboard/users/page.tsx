"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, UserPlus, Eye, EyeOff } from "lucide-react";
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
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users", {
        closeButton: true,
        className: "!bg-transparent !text-white",
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
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    axios.get("/api/auth/profile", { withCredentials: true })
      .then((res) => { if (res.data.success) setCurrentUserRole(res.data.user.role); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset to page 1 when search or sort changes
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortOrder]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const res = await axios.post("/api/users", createForm, { withCredentials: true });
      if (res.data.success) {
        toast.success("User created successfully", { closeButton: true, className: "!bg-transparent !text-white" });
        setCreateDialogOpen(false);
        setCreateForm({ username: "", email: "", password: "", role: "" });
        fetchUsers(1);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create user";
      toast.error(msg, { closeButton: true, className: "!bg-transparent !text-white" });
    } finally {
      setCreateLoading(false);
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
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "admin":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "editor":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "contributor":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
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
    <div className="min-h-screen w-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
            <p className="text-slate-400">Manage all system users</p>
          </div>
          {(currentUserRole === "superadmin" || currentUserRole === "admin") && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search users by username or email... (Press Enter)"
                className="pl-10 w-full bg-slate-900/60 text-white border-slate-600 placeholder-slate-400"
              />
            </div>

            {/* Sort By Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/60 text-white border-slate-600">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="createdAt" className="!text-white focus:bg-slate-700 cursor-pointer">
                  Created Date
                </SelectItem>
                <SelectItem value="username" className="!text-white focus:bg-slate-700 cursor-pointer">
                  Username
                </SelectItem>
                <SelectItem value="email" className="!text-white focus:bg-slate-700 cursor-pointer">
                  Email
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order Dropdown */}
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
            >
              <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/60 text-white border-slate-600">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-600">
                <SelectItem value="desc" className="!text-white focus:bg-slate-700 cursor-pointer">
                  Descending
                </SelectItem>
                <SelectItem value="asc" className="!text-white focus:bg-slate-700 cursor-pointer">
                  Ascending
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Apply Search Button */}
            <Button
              onClick={() => fetchUsers(1)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-300">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSortChange("username")}>
                    Username
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSortChange("email")}>
                    Email
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSortChange("createdAt")}>
                    Created At
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-slate-300">Updated At</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
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
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-48"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-40"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 bg-slate-700 rounded animate-pulse mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <>
                    <TableRow
                      key={user.id}
                      className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <TableCell className="text-slate-200 font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(user.updatedAt)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role || "")}`}>
                          {formatRole(user.role || "")}
                        </span>
                      </TableCell>
                    </TableRow>
                  </>
                ))
              ) : (
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-slate-400"
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
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(1)}
                  disabled={!pagination.hasPrevPage}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
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
                        onClick={() => fetchUsers(pageNum)}
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
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Last
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          {!loading && users.length > 0 && (
            <div className="mt-4 text-sm text-slate-400">
              Showing {users.length} of {pagination.totalCount} users
              {search && " (filtered by search)"}
            </div>
          )}
        </div>

        {/* User Details Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            className="bg-slate-900 !max-w-[700px] !w-full text-white overflow-y-auto"
          >
            {viewUser && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-white text-2xl">
                    User Details
                  </SheetTitle>
                  <SheetDescription className="text-slate-400">
                    Complete user information
                  </SheetDescription>
                </SheetHeader>

                {loadingUser ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-slate-400">Loading user details...</div>
                  </div>
                ) : (
                  <ViewUser user={viewUser} />
                )}
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateForm({ username: "", email: "", password: "", role: "" });
        }}>
          <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Create New User</DialogTitle>
              <DialogDescription className="text-slate-400">
                Fill in the details to create a new user account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="create-username" className="text-slate-300 text-sm">Username</Label>
                <Input
                  id="create-username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="username"
                  required
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-email" className="text-slate-300 text-sm">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    required
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-role" className="text-slate-300 text-sm">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(val) => setCreateForm((p) => ({ ...p, role: val }))}
                  required
                >
                  <SelectTrigger id="create-role" className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 text-white border-slate-600">
                    {currentUserRole === "superadmin" && (
                      <SelectItem value="admin" className="text-white! focus:bg-slate-700 cursor-pointer">Admin</SelectItem>
                    )}
                    <SelectItem value="editor" className="text-white! focus:bg-slate-700 cursor-pointer">Editor</SelectItem>
                    <SelectItem value="contributor" className="text-white! focus:bg-slate-700 cursor-pointer">Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer disabled:opacity-50"
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