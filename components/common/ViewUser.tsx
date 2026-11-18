"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/components/common/PermissionsProvider";
import { roleBadgeClass, roleLabel } from "@/components/common/roleDisplay";
import { listRoles, type AdminRoleDTO } from "@/lib/apiCallingRoles";
import {
  updateUserRole,
  User,
  UpdateUserRolePayload,
} from "@/lib/apiCallingUser";
import { Shield, Lock, Trash2 } from "lucide-react";

interface ViewUserProps {
  user: User;
  onRoleUpdate?: (updatedUser: User) => void;
  onDeleteRequest?: (user: User) => void;
}

// API helpers reject with either an Error or a plain { message } object
const getErrorMessage = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "message" in error
    ? (error as { message?: string }).message
    : undefined;

export default function ViewUser({ user, onRoleUpdate, onDeleteRequest }: ViewUserProps) {
  const [displayedUser, setDisplayedUser] = useState<User>(user);
  // selectedRole holds a role id (from /api/roles)
  const [selectedRole, setSelectedRole] = useState(user.roleId ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const { user: currentUser } = usePermissions();
  const currentUserId = currentUser?.id ?? null;
  const [assignableRoles, setAssignableRoles] = useState<AdminRoleDTO[]>([]);

  // Update displayedUser when user prop changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets local form state when a different user (or role) is passed in; parents do not remount via key
    setDisplayedUser(user);
    setSelectedRole(user.roleId ?? "");
  }, [user.id, user.roleId]);

  // Roles the signed-in user may assign (never Super Admin; Admin only for the Super Admin)
  useEffect(() => {
    let alive = true;
    listRoles({ assignable: true }).then((res) => {
      if (alive && res.success && res.roles) setAssignableRoles(res.roles);
    });
    return () => {
      alive = false;
    };
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
    if (!selectedRole || selectedRole === displayedUser.roleId) {
      toast.info("Role is already set to this value", {
        closeButton: true,
        className: "!bg-transparent !text-foreground",
      });
      return;
    }

    setIsUpdating(true);
    const loadingToastId = toast.loading("Updating user role...", {
      closeButton: true,
      className: "!bg-transparent !text-foreground",
    });

    try {
      const payload: UpdateUserRolePayload = { roleId: selectedRole };
      const response = await updateUserRole(displayedUser.id, payload);

      toast.dismiss(loadingToastId);

      if (response.success && response.user) {
        toast.success("User role updated successfully!", {
          closeButton: true,
          className: "!bg-transparent !text-foreground",
        });

        // Update local displayed user immediately
        // API returns only id/username/email/role — keep createdAt/updatedAt
        setDisplayedUser((prev) => ({ ...prev, ...response.user }));
        setSelectedRole(response.user.roleId ?? "");

        // Call callback to refresh user list in parent
        if (onRoleUpdate) {
          onRoleUpdate(response.user);
        }
      } else {
        toast.error(response.message || "Failed to update user role", {
          closeButton: true,
          className: "!bg-transparent !text-foreground",
        });
        setSelectedRole(displayedUser.roleId ?? "");
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      const errorMessage = getErrorMessage(error) || "Failed to update user role";
      toast.error(errorMessage, {
        closeButton: true,
        className: "!bg-transparent !text-foreground",
      });
      setSelectedRole(displayedUser.roleId ?? "");
    } finally {
      setIsUpdating(false);
    }
  };

  // This screen is only reachable with users.manage; the API repeats every check.
  const canUpdateRole = true;

  // Role update validations. `canManage` comes from the API: false when the
  // target holds a role the signed-in user couldn't assign (e.g. an Admin
  // looking at another Admin or a Super Admin).
  const isUpdatingOwnRole = currentUserId === displayedUser.id;
  const cannotManageTarget = !isUpdatingOwnRole && !displayedUser.canManage;

  const isRoleChangeDisabled = !canUpdateRole || isUpdating || cannotManageTarget;
  const hasRoleChange = !!selectedRole && selectedRole !== displayedUser.roleId;

  return (
    <div className="space-y-3 px-4 pb-4">
      {/* Profile + account dates */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-brand/15 text-brand-link text-base font-semibold">
              {displayedUser.username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground break-words">{displayedUser.username}</h2>
            <p className="text-sm text-muted-foreground break-all">{displayedUser.email}</p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadgeClass(displayedUser.roleKey ?? displayedUser.role)}`}
          >
            {roleLabel(displayedUser)}
          </span>
        </div>

        <dl className="grid grid-cols-2 divide-x divide-border border-t border-border">
          <Item label="Created At" value={formatDate(displayedUser.createdAt || "")} />
          <Item label="Last Updated" value={formatDate(displayedUser.updatedAt || "")} />
        </dl>
      </div>

      {/* Role Management Section - Only for Admin/SuperAdmin */}
      {canUpdateRole && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Role Management</h3>
          </div>

          {isUpdatingOwnRole || cannotManageTarget ? (
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {isUpdatingOwnRole
                  ? "You cannot change your own role."
                  : "You cannot change this user's role. Only the Super Admin can manage Admins, and the Super Admin role can't be changed."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <Label htmlFor="user-role-select" className="sr-only">
                    Select New Role
                  </Label>
                  <Select
                    value={assignableRoles.length > 0 ? selectedRole : ""}
                    onValueChange={setSelectedRole}
                    disabled={isRoleChangeDisabled}
                  >
                    <SelectTrigger id="user-role-select" className="w-full h-10">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasRoleChange && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRole(displayedUser.roleId ?? "")}
                    disabled={isUpdating}
                    className="h-10 disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleRoleUpdate}
                  disabled={isRoleChangeDisabled || !hasRoleChange}
                  className="h-10 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] cursor-pointer"
                >
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Role"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Changes take effect immediately.</p>
            </>
          )}
        </div>
      )}

      {/* Delete User - only users you outrank; never yourself or the Super Admin */}
      {displayedUser.canManage &&
        onDeleteRequest &&
        currentUserId !== displayedUser.id &&
        displayedUser.roleKey !== "superadmin" && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Delete User</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Permanently removes this account. Any content they authored will be reassigned to you.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => onDeleteRequest(displayedUser)}
              className="shrink-0 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          </div>
        )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
