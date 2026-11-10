"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getUserProfile } from "@/lib/apiCallingProfile";
import { 
  updateUserRole, 
  User, 
  UpdateUserRolePayload,
  changeUserPassword,
  ChangeUserPasswordPayload
} from "@/lib/apiCallingUser";
import { Shield, AlertCircle, ChevronDown, ChevronUp, Lock, Eye, EyeOff } from "lucide-react";

interface ViewUserProps {
  user: User;
  onRoleUpdate?: (updatedUser: User) => void;
}

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

export default function ViewUser({ user, onRoleUpdate }: ViewUserProps) {
  const [displayedUser, setDisplayedUser] = useState<User>(user);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    currentPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Update displayedUser when user prop changes
  useEffect(() => {
    setDisplayedUser(user);
    setSelectedRole(user.role);
    setShowRoleForm(false);
    // Reset password form when user changes
    setPasswordData({
      newPassword: "",
      confirmPassword: "",
      currentPassword: "",
    });
    setShowPasswordForm(false);
  }, [user.id, user.role]);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await getUserProfile();
        if (response.success && response.user) {
          setCurrentUserRole(response.user.role);
          setCurrentUserId(response.user.id);
        }
      } catch (error) {
        console.error("Error fetching current user role:", error);
      }
    };
    checkUserRole();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRoleUpdate = async () => {
    if (selectedRole === displayedUser.role) {
      toast.info("Role is already set to this value", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    setIsUpdating(true);
    const loadingToastId = toast.loading("Updating user role...", {
      closeButton: true,
      className: "!bg-transparent !text-white",
    });

    try {
      const payload: UpdateUserRolePayload = { role: selectedRole as any };
      const response = await updateUserRole(displayedUser.id, payload);

      toast.dismiss(loadingToastId);

      if (response.success && response.user) {
        toast.success("User role updated successfully!", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });

        // Update local displayed user immediately
        setDisplayedUser(response.user);
        setSelectedRole(response.user.role);

        // Call callback to refresh user list in parent
        if (onRoleUpdate) {
          onRoleUpdate(response.user);
        }
        
        // Close form after successful update
        setShowRoleForm(false);
      } else {
        toast.error(response.message || "Failed to update user role", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });
        setSelectedRole(displayedUser.role);
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      const errorMessage = error.message || "Failed to update user role";
      toast.error(errorMessage, {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      setSelectedRole(displayedUser.role);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePasswordUpdate = async () => {
    // Frontend validation matching backend
    if (!passwordData.newPassword) {
      toast.error("New password is required", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    const isUpdatingOwnPassword = currentUserId === displayedUser.id;

    // If changing own password, require current password
    if (isUpdatingOwnPassword && !passwordData.currentPassword) {
      toast.error("Current password is required when changing your own password", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    setIsChangingPassword(true);
    const loadingToastId = toast.loading("Updating password...", {
      closeButton: true,
      className: "!bg-transparent !text-white",
    });

    try {
      const payload: ChangeUserPasswordPayload = {
        newPassword: passwordData.newPassword,
      };

      // Add current password only if changing own password
      if (isUpdatingOwnPassword) {
        payload.currentPassword = passwordData.currentPassword;
      }

      const response = await changeUserPassword(displayedUser.id, payload);

      toast.dismiss(loadingToastId);

      if (response.success) {
        toast.success("Password updated successfully!", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });

        // Reset form
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
          currentPassword: "",
        });
        setShowPasswordForm(false);
      } else {
        toast.error(response.message || "Failed to update password", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      const errorMessage = error.message || "Failed to update password";
      toast.error(errorMessage, {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const canUpdateRole =
    currentUserRole === "admin" || currentUserRole === "superadmin";

  const canChangePassword = canUpdateRole;

  // Role update validations
  const isUpdatingOwnRole = currentUserId === displayedUser.id;
  const isAdminChangingSuperadmin =
    currentUserRole === "admin" && displayedUser.role === "superadmin";
  const isAdminAssigningSuperadmin =
    currentUserRole === "admin" && selectedRole === "superadmin";
  const isAdminAssigningAdmin =
    currentUserRole === "admin" && selectedRole === "admin";

  // Password update validations
  const isUpdatingOwnPassword = currentUserId === displayedUser.id;
  const isAdminChangingSuperadminPassword =
    currentUserRole === "admin" && displayedUser.role === "superadmin";

  // Determine which roles should be shown as disabled in the dropdown
  const isRoleDisabled = (roleValue: string) => {
    if (currentUserRole === "superadmin") {
      return false;
    }

    if (currentUserRole === "admin") {
      // Admin cannot assign superadmin or admin role
      if (roleValue === "superadmin" || roleValue === "admin") {
        return true;
      }
    }

    return false;
  };

  const isRoleChangeDisabled =
    !canUpdateRole ||
    isUpdating ||
    isAdminChangingSuperadmin ||
    isAdminAssigningSuperadmin ||
    isAdminAssigningAdmin;

  return (
    <div className="space-y-6 p-4 mt-4">
      {/* User Profile Section */}
      <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-slate-700">
        <Avatar className="h-24 w-24">
          <AvatarImage src="/dummy-user.png" />
          <AvatarFallback className="bg-indigo-500 text-white text-2xl font-semibold">
            {displayedUser.username
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">{displayedUser.username}</h2>
          <p className="text-sm text-slate-400">{displayedUser.email}</p>
          <div className="flex justify-center mt-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getRoleBadgeColor(displayedUser.role)}`}
            >
              {formatRole(displayedUser.role)}
            </span>
          </div>
        </div>
      </div>

      {/* User Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
        
        <div className="space-y-4">
          <Item label="Username" value={displayedUser.username} />
          <Item label="Email" value={displayedUser.email} />
          <Item
            label="Role"
            value={formatRole(displayedUser.role)}
          />
          <Item
            label="Created At"
            value={formatDate(displayedUser.createdAt || "")}
          />
          <Item
            label="Last Updated"
            value={formatDate(displayedUser.updatedAt || "")}
          />
        </div>
      </div>

      {/* Role Management Section - Only for Admin/SuperAdmin */}
      {canUpdateRole && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Role Management</h3>
            </div>
            <Button
              onClick={() => setShowRoleForm(!showRoleForm)}
              variant="outline"
              size="sm"
              className="border-indigo-500/50 text-indigo-400 hover:!bg-indigo-500/10 hover:text-indigo-300 !bg-transparent cursor-pointer"
            >
              {showRoleForm ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Form
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Update Role
                </>
              )}
            </Button>
          </div>

          {showRoleForm && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Select a new role for this user. Changes will take effect immediately.
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">
                    Select New Role <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={isRoleChangeDisabled}
                  >
                    <SelectTrigger className="w-full h-10 bg-slate-900/60 border-slate-600 text-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="!bg-slate-800 border-slate-600 text-white">
                      {currentUserRole === "superadmin" && (
                        <SelectItem
                          value="admin"
                          disabled={isRoleDisabled("admin")}
                          className="!text-white focus:bg-slate-700"
                        >
                          Admin
                        </SelectItem>
                      )}
                      <SelectItem
                        value="editor"
                        disabled={isRoleDisabled("editor")}
                        className="!text-white focus:bg-slate-700"
                      >
                        Editor
                      </SelectItem>
                      <SelectItem
                        value="contributor"
                        disabled={isRoleDisabled("contributor")}
                        className="!text-white focus:bg-slate-700"
                      >
                        Contributor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Messages */}
                {isAdminChangingSuperadmin && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400  flex-shrink-0" />
                    <p className="text-xs text-red-400">
                      You cannot change Super Admin's role. Only Super Admin can modify Super Admin roles.
                    </p>
                  </div>
                )}

                {isAdminAssigningSuperadmin && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">
                      You cannot assign Super Admin role. Only Super Admin can create Super Admin accounts.
                    </p>
                  </div>
                )}

                {isAdminAssigningAdmin && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">
                      You cannot assign Admin role. Only Super Admin can promote users to Admin.
                    </p>
                  </div>
                )}

                {isUpdatingOwnRole && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-400">
                      You cannot change your own role. Please ask another administrator to update your role.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRoleForm(false);
                      setSelectedRole(displayedUser.role);
                    }}
                    disabled={isUpdating}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50 !bg-transparent hover:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRoleUpdate}
                    disabled={
                      isRoleChangeDisabled ||
                      selectedRole === displayedUser.role ||
                      isUpdating ||
                      isUpdatingOwnRole
                    }
                    className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] cursor-pointer"
                  >
                    {isUpdating ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update Role"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Management Section - Only for Admin/SuperAdmin */}
      {canChangePassword && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Password Management</h3>
            </div>
            <Button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              variant="outline"
              size="sm"
              className="border-indigo-500/50 text-indigo-400 hover:!bg-indigo-500/10 hover:text-indigo-300 !bg-transparent cursor-pointer"
            >
              {showPasswordForm ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Form
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Change Password
                </>
              )}
            </Button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                {isUpdatingOwnPassword
                  ? "Change your password. You'll need to provide your current password."
                  : "Set a new password for this user. The user will need to use this password to login."}
              </p>

              {/* Error Messages */}
              {isAdminChangingSuperadminPassword && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">
                    You cannot change Super Admin's password. Only Super Admin can modify Super Admin passwords.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Current Password - Only required when changing own password */}
                {isUpdatingOwnPassword && (
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm font-medium">
                      Current Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        className="w-full bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 pr-10"
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
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">
                    New Password <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password (min. 6 characters)"
                      className="w-full bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 pr-10"
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
                  {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                    <p className="text-xs text-red-400">
                      Password must be at least 6 characters long
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">
                    Confirm New Password <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-900/60 border-slate-600 text-white placeholder-slate-400 pr-10"
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
                  {passwordData.confirmPassword && 
                   passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-400">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        newPassword: "",
                        confirmPassword: "",
                        currentPassword: "",
                      });
                    }}
                    disabled={isChangingPassword}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50 !bg-transparent hover:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={
                      isChangingPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword ||
                      passwordData.newPassword.length < 6 ||
                      passwordData.newPassword !== passwordData.confirmPassword ||
                      (isUpdatingOwnPassword && !passwordData.currentPassword) ||
                      isAdminChangingSuperadminPassword
                    }
                    className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Item({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center border-b border-slate-700 py-3">
      <span className={`text-slate-400 font-medium ${className || "text-sm"}`}>
        {label}
      </span>
      <span
        className={`text-white font-medium text-right max-w-[60%] break-words ${className || "text-sm"}`}
      >
        {value}
      </span>
    </div>
  );
}