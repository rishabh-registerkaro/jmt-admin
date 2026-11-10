import axiosInstance from "./axiosInstance";

// apiCalling for user profile
export interface UserProfile {
    id: string;
    email: string;
    username: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetUserProfileResponse {
    success: boolean;
    user?: UserProfile;
    message?: string;
}

// Types for User Published Content
export interface UserContentPostAuthor {
    _id?: string;
    username?: string;
    email?: string;
}

export interface UserContentPostSummary {
    _id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published' | string;
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    author?: UserContentPostAuthor;
}

export interface UserContentPageAuthor {
    _id?: string;
    username?: string;
    email?: string;
}

export interface UserContentPageSummary {
    _id: string;
    pageTitle: string;
    pageSlug: string;
    pageMetaTitle?: string;
    pageMetaDescription?: string;
    status?: 'draft' | 'published' | string;
    createdAt?: string;
    updatedAt?: string;
    author?: UserContentPageAuthor;
}

export interface UserContentPaginationInfo {
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface UserContentPagination {
    posts: UserContentPaginationInfo;
    pages: UserContentPaginationInfo;
}

export interface GetUserPublishedContentData {
    posts: UserContentPostSummary[];
    pages: UserContentPageSummary[];
    pagination: UserContentPagination;
}

export interface GetUserPublishedContentResponse {
    success: boolean;
    data?: GetUserPublishedContentData;
    message?: string;
}

export interface GetUserPublishedContentPayload {
    userId: string;
    // Unified pagination (optional - applies to both if separate params not provided)
    page?: number;
    limit?: number;
    // Separate pagination (optional - overrides unified params)
    postsPage?: number;
    postsLimit?: number;
    pagesPage?: number;
    pagesLimit?: number;
}


export interface UpdateUserProfilePayload {
    email: string;
    username: string;
}

export interface UpdateUserProfileResponse {
    success: boolean;
    message?: string;
    user?: UserProfile;
}

export interface UserListItem{
    _id: string;
    id: string;
    username: string;
}

export interface GetUsersResponse {
    success: boolean;
    users: UserListItem[];
    message?: string;
}



/**
 * Get user profile data
 */
export const getUserProfile = async (): Promise<GetUserProfileResponse> => {
    try {
        const response = await axiosInstance.get('/api/auth/profile');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch user Profile'
        }
    }
}



/**
 * Get published posts and pages by userId with pagination
 * @param payload - Object containing userId and pagination parameters
 * @returns Promise with published posts, pages, and pagination info
 * 
 * @example
 * // Get posts page 2 and pages page 1
 * const response = await getUserPublishedContent({
 *   userId: "692d1f32df05a99b19f8c8c1",
 *   postsPage: 2,
 *   pagesPage: 1
 * });
 * 
 * @example
 * // Get both with unified pagination
 * const response = await getUserPublishedContent({
 *   userId: "692d1f32df05a99b19f8c8c1",
 *   page: 1,
 *   limit: 10
 * });
 */
export const getUserPublishedContent = async (
    payload: GetUserPublishedContentPayload
): Promise<GetUserPublishedContentResponse> => {
    try {
        const response = await axiosInstance.post<GetUserPublishedContentResponse>(
            "/api/auth/profile",
            payload
        );

        return response.data;
    } catch (error: any) {
        console.error("Error fetching user published content:", error);
        return {
            success: false,
            message:
                error?.response?.data?.message ||
                "Failed to fetch user published content.",
        };
    }
};

/**
 * Update user profile (email and username only)
 * @param payload - Object containing email and username
 * @returns Promise with updated user data
 */

export const updateUserProfile = async (
    payload: UpdateUserProfilePayload
): Promise<UpdateUserProfileResponse> => {
    try {
        const response = await axiosInstance.put<UpdateUserProfileResponse>(
            `/api/auth/profile`, payload
        )
        return response.data;
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to update user Porilfe"
        }
    }
}

// Add this function near the end of the file
/**
 * Get all users (id and username only)
 * @returns Promise with list of users
 */

export const getUsers = async (): Promise<GetUsersResponse> =>{
    try {
        const response = await axiosInstance.get<GetUsersResponse>('/api/auth/users');
        return response.data;
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return {
            success: false,
            users: [],
            message: error?.response?.data?.message || "Failed to fetch users.",
        };
    }
}