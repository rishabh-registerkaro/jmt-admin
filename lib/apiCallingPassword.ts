import axios from "axios";

export interface RequestOTPPayload {
    email: string;
}

export interface RequestOTPResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface VerifyOTPPayload {
    email: string;
    otp: string;
}

export interface VerifyOTPResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface ResetPasswordPayload {
    email: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
    error?: string;
}


/**
 * Request OTP for password reset
 * @param payload - Object containing email
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise with response data
 */

export const requestOTP = async (
    payload: RequestOTPPayload,
    signal?: AbortSignal
): Promise<RequestOTPResponse> => {
    try {
        const response = await axios.post<RequestOTPResponse>('/api/auth/forgot-password/request-otp',
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                signal, // Add signal for cancellation
            })

        return response.data;
    } catch (error: any) {
        // Check if request was cancelled
        if (axios.isCancel(error) || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
            return {
                success: false,
                message: "Request cancelled",
            };
        }
        
        console.error("Error requesting OTP:", error);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Failed to send OTP. Please try again.",
            error: error.response?.data?.error,
        };
    }
}


/**
 * Verify OTP code
 * @param payload - Object containing email and otp
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise with response data
 */

export const verifyOTP = async (
    payload: VerifyOTPPayload,
    signal?: AbortSignal
): Promise<VerifyOTPResponse> => {
    try {
        const response = await axios.post<VerifyOTPResponse>(
            '/api/auth/forgot-password/verify-otp',
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
                signal, // Add signal for cancellation
            }
        )

        return response.data;
    } catch (error: any) {
        // Check if request was cancelled
        if (axios.isCancel(error) || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
            return {
                success: false,
                message: "Request cancelled",
            };
        }
        
        console.error("Error verifying OTP:", error);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Failed to verify OTP. Please try again.",
            error: error.response?.data?.error,
        };
    }
}



/**
 * Reset password with new password
 * @param payload - Object containing email and newPassword
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Promise with response data
 */

export const resetPassword = async (
    payload: ResetPasswordPayload,
    signal?: AbortSignal
): Promise<ResetPasswordResponse> => {
    try {
        const response = await axios.post<ResetPasswordResponse>('/api/auth/forgot-password/reset-password',
            payload,
            {
                headers:{
                    'Content-Type': "application/json",
                },
                withCredentials: true, // Important for cookies
                signal, // Add signal for cancellation
            }
        );

        return response.data;
    } catch (error:any) {
        // Check if request was cancelled
        if (axios.isCancel(error) || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
            return {
                success: false,
                message: "Request cancelled",
            };
        }
        
        console.error("Error resetting password:", error);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Failed to reset password. Please try again.",
            error: error.response?.data?.error,
        };
    }
}