import axiosInstance from "./axiosInstance";
import { getApiErrorBody } from "./apiError";

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateUserRolePayload {
    role: "superadmin" | "admin" | "editor" | "contributor";
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
 * const response = await updateUserRole("userId123", { role: "admin" });
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


/**
 * Delete a user (Super Admin only). Their content is reassigned to the caller.
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosInstance.delete(`/api/users/${userId}`);
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
 * Change user password (Admin/SuperAdmin only)
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