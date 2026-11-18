import axiosInstance from "./axiosInstance";
import { getApiErrorBody } from "./apiError";

export interface User {
    id: string;
    username: string;
    email: string;
    /** Legacy role enum value — prefer roleId / roleName. */
    role: string;
    roleId?: string | null;
    roleKey?: string;
    roleName?: string;
    /** The signed-in user may change this user's role / password / delete them. */
    canManage?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateUserRolePayload {
    /** Role to assign (from /api/roles). */
    roleId?: string;
    /** Legacy: still accepted by the API and mapped to the matching built-in role. */
    role?: "superadmin" | "admin" | "editor" | "contributor";
}

export interface UpdateUserRoleResponse {
    success: boolean;
    message?: string;
    user?: User;
}

export interface ChangeUserPasswordPayload {
    newPassword: string;
    currentPassword?: string;
}

export interface ChangeUserPasswordResponse {
    success: boolean;
    message?: string;
}

/**
 * Update user role
 * @param userId - The ID of the user whose role needs to be updated
 * @param payload - Object containing the new role
 * @returns Promise with updated user data
 * 
 * @example
 * const response = await updateUserRole("userId123", { roleId: "role_cuid" });
 */

export const updateUserRole = async (userId: string, payload: UpdateUserRolePayload): Promise<UpdateUserRoleResponse> => {
    try {
        const response = await axiosInstance.patch<UpdateUserRoleResponse>(`/api/users/${userId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating user role:", error);
        return {
            success: false,
            message: getApiErrorBody(error)?.message || "Failed to update user role",
        };
    }
}


export interface UserTransferInfo {
    success: boolean;
    message?: string;
    owned?: { posts: number; servicePages: number; packageBlocks: number; jmtServicePages: number; autosaves: number };
    ownsWork?: boolean;
    /** Users with the same access or more, who may take over this user's work. */
    candidates?: { id: string; username: string; roleName: string }[];
}

/**
 * What a user owns and who may take it over, for the delete dialog.
 */
export const getUserTransferInfo = async (userId: string): Promise<UserTransferInfo> => {
    try {
        const response = await axiosInstance.get<UserTransferInfo>(`/api/users/${userId}/transfer-info`);
        return response.data;
    } catch (error) {
        console.error("Error loading user transfer info:", error);
        return {
            success: false,
            message: getApiErrorBody(error)?.message || "Failed to load this user's work",
        };
    }
}


/**
 * Delete a user (users.manage, only users the caller outranks). Their work moves to `transferTo`.
 */
export const deleteUser = async (userId: string, transferTo?: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosInstance.delete(`/api/users/${userId}`, { params: transferTo ? { transferTo } : undefined });
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        return {
            success: false,
            message: getApiErrorBody(error)?.message || "Failed to delete user",
        };
    }
}


/**
 * Change user password (users.manage, or your own)
 * @param userId - The ID of the user whose password needs to be changed
 * @param payload - Object containing newPassword and optionally currentPassword (for own password)
 * @returns Promise with response
 */

export const changeUserPassword = async (userId: string, payload: ChangeUserPasswordPayload): Promise<ChangeUserPasswordResponse> => {
    try {
        const response = await axiosInstance.patch<ChangeUserPasswordResponse>(
            `/api/users/${userId}?updatePassword=true`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error changing user password:", error);
        return {
            success: false,
            message: getApiErrorBody(error)?.message || "Failed to change user password",
        };
    }
}