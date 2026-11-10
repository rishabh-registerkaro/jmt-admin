import axiosInstance from "./axiosInstance";

export interface LogoutResponse {
    message: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    message: string;
}

/**
 * Logout the current user
 * @returns Promise with logout response
 */

export const logout = async (): Promise<LogoutResponse> => {
    try {
        const response = await axiosInstance.post<LogoutResponse>('/api/auth/logout');

        // Check if response status is OK (200-299)
        const isOk = response.status >= 200 && response.status < 300;

        if (isOk && response.data) {
            return response.data;
        }

        throw new Error("Failed to logout");
    } catch (error: any) {
        console.error("Error logging out:", error);
        throw {
            message: error.response?.data?.message || error.message || "Failed to logout",
        };
    }
};


/**
 * Change user password
 * @param payload - Object containing currentPassword and newPassword
 * @returns Promise with change password response
 */

export const changePassword = async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
    try {
        const response = await axiosInstance.put<ChangePasswordResponse>("/api/auth/profile/change-password", payload);

        const isOK = response.status >= 200 && response.status < 300;
        if (isOK && response.data) {
            return response.data;
        }
        throw new Error("Failed to change password");
    } catch (error: any) {
        console.error("Error changing password:", error);
        throw {
            message: error.response?.data?.message || error.message || "Failed to change password",
        };
    }
}
