import axios from "axios";

// Shape of the JSON error body returned by the admin API routes
export interface ApiErrorBody {
    message?: string;
    error?: string;
    errors?: string[];
}

/**
 * Get the API error body from a failed axios request (undefined for any other error)
 */
export const getApiErrorBody = (error: unknown): ApiErrorBody | undefined => {
    if (axios.isAxiosError<ApiErrorBody | undefined>(error)) {
        return error.response?.data;
    }
    return undefined;
};

/**
 * Get the message of a thrown Error (undefined for non-Error values)
 */
export const getErrorMessage = (error: unknown): string | undefined => {
    return error instanceof Error ? error.message : undefined;
};

/**
 * Check if a request failed because it was cancelled/aborted
 */
export const isRequestCancelled = (error: unknown): boolean => {
    if (axios.isCancel(error)) return true;
    if (typeof error !== "object" || error === null) return false;
    return (
        ("name" in error && error.name === 'AbortError') ||
        ("code" in error && error.code === 'ERR_CANCELED')
    );
};
