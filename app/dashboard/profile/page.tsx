"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUserProfile, UserProfile, updateUserProfile, getUserPublishedContent, UserContentPostSummary, UserContentPageSummary, UserContentPagination } from "@/lib/apiCallingProfile";
import { toast } from "sonner";
import { User, Shield, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// update password api 
import { changePassword } from "@/lib/apiCallingAuth";

type TabType = "profile" | "security";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
  });
  const [posts, setPosts] = useState<UserContentPostSummary[]>([]);
  const [pages, setPages] = useState<UserContentPageSummary[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [pagination, setPagination] = useState<UserContentPagination | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch published content when userData is available
  useEffect(() => {
    if (userData?.id) {
      fetchUserPublishedContent();
    }
  }, [userData?.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();

      if (response.success && response.user) {
        setUserData(response.user);
        setFormData({
          email: response.user.email,
          username: response.user.username,
        });
      } else {
        toast.error(response.message || "Failed to fetch profile", {
          closeButton: true,
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data", {
        closeButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPublishedContent = async (
    postsPage: number = 1,
    pagesPage: number = 1
  ) => {
    if (!userData?.id) return;

    try {
      setContentLoading(true);
      const response = await getUserPublishedContent({
        userId: userData.id,
        postsPage,
        pagesPage,
        postsLimit: 10,
        pagesLimit: 10,
      });

      if (response.success && response.data) {
        setPosts(response.data.posts || []);
        setPages(response.data.pages || []);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || "Failed to fetch published content", {
          closeButton: true,
        });
      }
    } catch (error: any) {
      console.error("Error fetching published content:", error);
      toast.error("Failed to load published content", {
        closeButton: true,
      });
    } finally {
      setContentLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userData) {
      setFormData({
        email: userData.email,
        username: userData.username,
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isEditing) {
      return;
    }

    if (!formData.email || !formData.username) {
      toast.error("Please fill in all fields", {
        closeButton: true,
      });
      return;
    }

    setUpdating(true);
    const loadingToastId = toast.loading("Updating profile...", {
      closeButton: true,
    });

    try {
      // TODO: Add PUT API call here when ready
      // const response = await updateUserProfile(formData);
      const response = await updateUserProfile({
        email: formData.email,
        username: formData.username,
      })

      if (response.success) {
        toast.dismiss(loadingToastId);
        toast.success("Profile updated successfully!", {
          closeButton: true,
        });
      }

      toast.dismiss(loadingToastId);
      toast.success("Profile updated successfully!", {
        closeButton: true,
      });

      // Refresh profile data and exit edit mode
      await fetchUserProfile();
      setIsEditing(false);
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      toast.error(error.message || "Failed to update profile", {
        closeButton: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen w-full p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-400">Failed to load profile data</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account settings and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer",
              activeTab === "profile"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
            )}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer",
              activeTab === "security"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
            )}
          >
            <Shield className="h-4 w-4" />
            Security
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <ProfileTab
            userData={userData}
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            updating={updating}
            setUpdating={setUpdating}
            handleChange={handleChange}
            handleCancel={handleCancel}
            handleSubmit={handleSubmit}
            posts={posts}
            pages={pages}
            contentLoading={contentLoading}
            pagination={pagination}
            fetchUserPublishedContent={fetchUserPublishedContent}
            formatDate={formatDate}
          />
        )}

        {activeTab === "security" && (
          <SecurityTab userData={userData} />
        )}
      </div>
    </div>
  );
}

// Profile Tab Component
interface ProfileTabProps {
  userData: UserProfile | null;
  formData: { email: string; username: string };
  setFormData: React.Dispatch<React.SetStateAction<{ email: string; username: string }>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  updating: boolean;
  setUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  posts: UserContentPostSummary[];
  pages: UserContentPageSummary[];
  contentLoading: boolean;
  pagination: UserContentPagination | null;
  fetchUserPublishedContent: (postsPage?: number, pagesPage?: number) => Promise<void>;
  formatDate: (dateString?: string) => string;
}

function ProfileTab({
  userData,
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  updating,
  setUpdating,
  handleChange,
  handleCancel,
  handleSubmit,
  posts,
  pages,
  contentLoading,
  pagination,
  fetchUserPublishedContent,
  formatDate,
}: ProfileTabProps) {


  const getRoleInputColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-gradient-to-r from-purple-600/30 to-purple-500/20 text-purple-200 border-purple-500/50  shadow-purple-500/20";
      case "admin":
        return "bg-gradient-to-r from-indigo-600/30 to-indigo-500/20 text-indigo-200 border-indigo-500/50  shadow-indigo-500/20";
      case "editor":
        return "bg-gradient-to-r from-green-600/30 to-green-500/20 text-green-200 border-green-500/50  shadow-green-500/20";
      case "contributor":
        return "bg-gradient-to-r from-yellow-600/30 to-yellow-500/20 text-yellow-200 border-yellow-500/50  shadow-yellow-500/20";
      default:
        return "bg-gradient-to-r from-slate-600/30 to-slate-500/20 text-slate-200 border-slate-500/50  shadow-slate-500/20";
    }
  };

  const formatRole = (role: string) => {
    if (!role) return "N/A";
    return role === "superadmin" ? "Super Admin" : role === "admin" ? "Admin" : role === "editor" ? "Editor" : role === "contributor" ? "Contributor" : "N/A";
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-2 mb-0">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1: Email and Username */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                Email <span className="text-red-400">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                disabled={!isEditing}
                className={`w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white ${!isEditing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-slate-200">
                Username <span className="text-red-400">*</span>
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                disabled={!isEditing}
                className={`w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white ${!isEditing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              />
            </div>

            {/* Row 2: Role and Account Created */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Role
              </label>
              {/* <Input
                value={formatRole(userData?.role || "N/A")}
                disabled
                className={`w-full rounded-lg border font-semibold backdrop-blur-sm cursor-not-allowed ${getRoleInputColor(userData?.role || "")}`}
              /> */}
              <div className={`inline-flex w-full items-center px-3 py-2 rounded-lg text-sm font-medium border ${getRoleInputColor(userData?.role || "")}`}>
                {formatRole(userData?.role || "N/A")}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Account Created
              </label>
              <Input
                value={userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : "N/A"}
                disabled
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white opacity-60 cursor-not-allowed selection:bg-indigo-500 selection:text-white"
              />
            </div>

            {/* Row 3: Last Updated */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Last Updated
              </label>
              <Input
                value={userData?.updatedAt ? new Date(userData.updatedAt).toLocaleString() : "N/A"}
                disabled
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white opacity-60 cursor-not-allowed selection:bg-indigo-500 selection:text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updating}
                className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating || !formData.email || !formData.username}
                className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Edit
            </Button>
          )}
        </div>
      </form>

      {/* Published Posts Section */}
      <div className="">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Published Posts</h2>
        </div>

        {contentLoading ? (
          <div className="text-center py-8 text-slate-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No published posts found</div>
        ) : (
          <>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-800/50">
                    <TableHead className="text-slate-200">Title</TableHead>

                    <TableHead className="text-slate-200">Status</TableHead>
                    <TableHead className="text-slate-200">Published At</TableHead>
                    <TableHead className="text-slate-200">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post._id} className="hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">{post.title}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${post.status === 'published'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                          {post.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{formatDate(post.publishedAt)}</TableCell>
                      <TableCell className="text-slate-300">{formatDate(post.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Posts Pagination */}
            {pagination?.posts && pagination.posts.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-400">
                  Page {pagination.posts.currentPage} of {pagination.posts.totalPages} ({pagination.posts.totalItems} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUserPublishedContent(pagination.posts.currentPage - 1, pagination.pages?.currentPage || 1)}
                    disabled={!pagination.posts.hasPrevPage}
                    className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUserPublishedContent(pagination.posts.currentPage + 1, pagination.pages?.currentPage || 1)}
                    disabled={!pagination.posts.hasNextPage}
                    className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Services Section */}
      <div className="">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Products</h2>
        </div>

        {contentLoading ? (
          <div className="text-center py-8 text-slate-400">Loading services...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No services found</div>
        ) : (
          <>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-800/50">
                    <TableHead className="text-slate-200">Service Title</TableHead>
                    <TableHead className="text-slate-200">Slug</TableHead>
                    <TableHead className="text-slate-200">Status</TableHead>
                    <TableHead className="text-slate-200">Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page._id} className="hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">{page.pageTitle}</TableCell>
                      <TableCell className="text-slate-400 text-sm">{page.pageSlug}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          page.status === 'published'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {page.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{formatDate(page.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Services Pagination */}
            {pagination?.pages && pagination.pages.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-400">
                  Page {pagination.pages.currentPage} of {pagination.pages.totalPages} ({pagination.pages.totalItems} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUserPublishedContent(pagination.posts?.currentPage || 1, pagination.pages.currentPage - 1)}
                    disabled={!pagination.pages.hasPrevPage}
                    className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUserPublishedContent(pagination.posts?.currentPage || 1, pagination.pages.currentPage + 1)}
                    disabled={!pagination.pages.hasNextPage}
                    className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// Security Tab Component
interface SecurityTabProps {
  userData: UserProfile | null;
}

// function SecurityTab({ userData }: SecurityTabProps) {
//   const [passwordData, setPasswordData] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });
//   const [showPasswords, setShowPasswords] = useState({
//     current: false,
//     new: false,
//     confirm: false,
//   });

//   const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setPasswordData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
//     setShowPasswords((prev) => ({
//       ...prev,
//       [field]: !prev[field],
//     }));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
//         <h2 className="text-xl font-semibold text-white mb-2">Change Password</h2>
//         <p className="text-slate-400 mb-4">
//           Update your account password to keep your account secure.
//         </p>

//         <div className="space-y-4">
//           {/* Current Password */}
//           <div className="space-y-2">
//             <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-200">
//               Current Password <span className="text-red-400">*</span>
//             </label>
//             <div className="relative">
//               <Input
//                 id="currentPassword"
//                 name="currentPassword"
//                 type={showPasswords.current ? "text" : "password"}
//                 value={passwordData.currentPassword}
//                 onChange={handlePasswordChange}
//                 placeholder="Enter current password"
//                 required
//                 className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white pr-10"
//               />
//               <button
//                 type="button"
//                 onClick={() => togglePasswordVisibility("current")}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
//               >
//                 {showPasswords.current ? (
//                   <EyeOff className="h-4 w-4" />
//                 ) : (
//                   <Eye className="h-4 w-4" />
//                 )}
//               </button>
//             </div>
//           </div>

//           <div className="flex sm:flex-row flex-col items-center justify-between gap-4 w-full">
//             {/* New Password */}
//             <div className="space-y-2 w-full">
//               <label htmlFor="newPassword" className="block text-sm font-medium text-slate-200">
//                 New Password <span className="text-red-400">*</span>
//               </label>
//               <div className="relative">
//                 <Input
//                   id="newPassword"
//                   name="newPassword"
//                   type={showPasswords.new ? "text" : "password"}
//                   value={passwordData.newPassword}
//                   onChange={handlePasswordChange}
//                   placeholder="Enter new password"
//                   required
//                   className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => togglePasswordVisibility("new")}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
//                 >
//                   {showPasswords.new ? (
//                     <EyeOff className="h-4 w-4" />
//                   ) : (
//                     <Eye className="h-4 w-4" />
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div className="space-y-2 w-full">
//               <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">
//                 Confirm New Password <span className="text-red-400">*</span>
//               </label>
//               <div className="relative">
//                 <Input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type={showPasswords.confirm ? "text" : "password"}
//                   value={passwordData.confirmPassword}
//                   onChange={handlePasswordChange}
//                   placeholder="Confirm new password"
//                   required
//                   className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => togglePasswordVisibility("confirm")}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
//                 >
//                   {showPasswords.confirm ? (
//                     <EyeOff className="h-4 w-4" />
//                   ) : (
//                     <Eye className="h-4 w-4" />
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

function SecurityTab({ userData }: SecurityTabProps) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Frontend validation: Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match", {
        closeButton: true
      });
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long", {
        closeButton: true,
      });
      return;
    }

    setChangingPassword(true);
    const loadingToastId = toast.loading("Changing password...", {
      closeButton: true,
    });

    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        // Note: confirmPassword is NOT sent to backend - only validated on frontend
      });

      toast.dismiss(loadingToastId);

      if (response.success) {
        toast.success("Password changed successfully!", {
          closeButton: true,
        });
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(response.message || "Failed to change password", {
          closeButton: true,
        });
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      toast.error(error.message || "Failed to change password", {
        closeButton: true,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Change Password</h2>
        <p className="text-slate-400 mb-4">
          Update your account password to keep your account secure.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-200">
              Current Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center justify-between gap-4 w-full">
            {/* New Password */}
            <div className="space-y-1 w-full">
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-200">
                New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 w-full">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">
                Confirm New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-start">
            <Button
              type="submit"
              disabled={
                changingPassword ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
              className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {changingPassword ? "Changing..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}