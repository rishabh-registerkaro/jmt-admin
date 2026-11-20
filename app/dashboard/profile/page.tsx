"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUserProfile, UserProfile, updateUserProfile } from "@/lib/apiCallingProfile";
import { toast } from "sonner";
import { toApiError } from "@/app/dashboard/_lib/api-error";
import { User, Shield, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// update password api 
import { changePassword } from "@/lib/apiCallingAuth";
import { roleBadgeClass, roleLabel } from "@/components/common/roleDisplay";

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
    currentPassword: "",
  });

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();

      if (response.success && response.user) {
        setUserData(response.user);
        setFormData({
          email: response.user.email,
          username: response.user.username,
          currentPassword: "",
        });
      } else {
        toast.error(response.message || "Failed to fetch profile", {
          closeButton: true,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data", {
        closeButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dependency change; the fetcher sets state
    fetchUserProfile();
  }, []);

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
        currentPassword: "",
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
      const response = await updateUserProfile({
        email: formData.email,
        username: formData.username,
        // Required by the API only when the email changes
        ...(emailChanged(formData.email, userData) && { currentPassword: formData.currentPassword }),
      })

      toast.dismiss(loadingToastId);
      if (!response.success) {
        // e.g. 400 "email/username already taken" — nothing was saved
        toast.error(response.message || "Failed to update profile", { closeButton: true });
        return;
      }
      toast.success("Profile updated successfully!", {
        closeButton: true,
      });

      // Refresh profile data and exit edit mode
      await fetchUserProfile();
      setIsEditing(false);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(toApiError(error).message || "Failed to update profile", {
        closeButton: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full p-6 sm:p-10 bg-background text-foreground flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen w-full p-6 sm:p-10 bg-background text-foreground flex items-center justify-center">
        <div className="text-xl text-destructive">Failed to load profile data</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer",
              activeTab === "profile"
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong"
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
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong"
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
          />
        )}

        {activeTab === "security" && (
          <SecurityTab />
        )}
      </div>
    </div>
  );
}

// True when the edited email differs from the saved one (same comparison as the API)
function emailChanged(email: string, userData: UserProfile | null) {
  return !!userData && email.toLowerCase().trim() !== userData.email.toLowerCase();
}

// Profile Tab Component
interface ProfileTabProps {
  userData: UserProfile | null;
  formData: { email: string; username: string; currentPassword: string };
  setFormData: React.Dispatch<React.SetStateAction<{ email: string; username: string; currentPassword: string }>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  updating: boolean;
  setUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

function ProfileTab({
  userData,
  formData,
  isEditing,
  setIsEditing,
  updating,
  handleChange,
  handleCancel,
  handleSubmit,
}: ProfileTabProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const needsPassword = isEditing && emailChanged(formData.email, userData);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-2 mb-0">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1: Email and Username */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground-light">
                Email <span className="text-destructive">*</span>
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
                className={`w-full ${!isEditing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground-light">
                Username <span className="text-destructive">*</span>
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
                className={`w-full ${!isEditing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              />
            </div>

            {needsPassword && (
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="profileCurrentPassword" className="block text-sm font-medium text-foreground-light">
                  Current Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="profileCurrentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password to change your email"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Row 2: Role and Account Created */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground-light">
                Role
              </label>
              {/* <Input
                value={roleLabel(userData)}
                disabled
                className={`w-full rounded-lg border font-semibold cursor-not-allowed ${roleBadgeClass(userData?.roleKey ?? userData?.role)}`}
              /> */}
              <div className={`inline-flex w-full items-center px-3 py-2 rounded-lg text-sm font-medium border ${roleBadgeClass(userData?.roleKey ?? userData?.role)}`}>
                {roleLabel(userData)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground-light">
                Account Created
              </label>
              <Input
                value={userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : "N/A"}
                disabled
                className="w-full rounded-lg border opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Row 3: Last Updated */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground-light">
                Last Updated
              </label>
              <Input
                value={userData?.updatedAt ? new Date(userData.updatedAt).toLocaleString() : "N/A"}
                disabled
                className="w-full rounded-lg border opacity-60 cursor-not-allowed"
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
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating || !formData.email || !formData.username || (needsPassword && !formData.currentPassword)}
                className="disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className=""
            >
              Edit
            </Button>
          )}
        </div>
      </form>

    </>
  );
}

// Security Tab Component
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
//       <div className="rounded-lg border bg-card p-6">
//         <h2 className="text-base font-semibold text-foreground mb-2">Change Password</h2>
//         <p className="text-sm text-muted-foreground mb-4">
//           Update your account password to keep your account secure.
//         </p>

//         <div className="space-y-4">
//           {/* Current Password */}
//           <div className="space-y-2">
//             <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground-light">
//               Current Password <span className="text-destructive">*</span>
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
//                 className="w-full rounded-lg border pr-10"
//               />
//               <button
//                 type="button"
//                 onClick={() => togglePasswordVisibility("current")}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
//               <label htmlFor="newPassword" className="block text-sm font-medium text-foreground-light">
//                 New Password <span className="text-destructive">*</span>
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
//                   className="w-full rounded-lg border pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => togglePasswordVisibility("new")}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
//               <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground-light">
//                 Confirm New Password <span className="text-destructive">*</span>
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
//                   className="w-full rounded-lg border pr-10"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => togglePasswordVisibility("confirm")}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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

function SecurityTab() {
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
    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long", {
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
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(toApiError(error).message || "Failed to change password", {
        closeButton: true,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground mb-2">Change Password</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update your account password to keep your account secure.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground-light">
              Current Password <span className="text-destructive">*</span>
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
                className="w-full rounded-lg border pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground-light">
                New Password <span className="text-destructive">*</span>
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
                  className="w-full rounded-lg border pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground-light">
                Confirm New Password <span className="text-destructive">*</span>
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
                  className="w-full rounded-lg border pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
              className="disabled:cursor-not-allowed"
            >
              {changingPassword ? "Changing..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}