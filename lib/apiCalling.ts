import axiosInstance from "./axiosInstance";

// Types
export interface Author {
  _id: string;
  email: string;
  username: string;
}

export interface Post {
  _id: string;
  title: string;
  author: Author;
  status: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetPostsResponse {
  success: boolean;
  posts: Post[];
  pagination: Pagination;
  message?: string;
}

export interface GetPostResponse {
  success: boolean;
  post: any; // Full post object with all fields (title, slug, content, category, faq_items, additionalFields, etc.)
  message?: string;
}


export interface CreatePostPayload {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string[];
  tags?: string[];
  status?: "draft" | "published";
  publishedAt?: string | null;
  faq_items?: Array<{ question: string; answer: string }>;
  additionalFields?: Record<string, any>;
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  post: {
    id: string;
    title: string;
    slug: string;
    status: string;
    createdAt: string;
  };
  errors?: string[];
}

export interface UpdatePostPayload {
  id: string; // Required for update
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  category?: string[];
  status?: "draft" | "published";
  publishedAt?: string | null;
  faq_items?: Array<{ question: string; answer: string }>;
  additionalFields?: Record<string, any>;
}

export interface UpdatePostResponse {
  success: boolean;
  message: string;
  post: {
    id: string;
    title: string;
    slug: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  errors?: string[];
}

export interface DeletePostResponse {
  success: boolean;
  message: string;
}

// API Functions

/**
 * Get all posts with pagination and optional status filter
 * @param page - Page number (default: 1)
 * @param limit - Number of posts per page (default: 10)
 * @param status - Optional status filter ("draft" | "published")
 * @returns Promise with posts data and pagination info
 */
export const getPosts = async (
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<GetPostsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append("status", status);
    }

    const response = await axiosInstance.get<GetPostsResponse>(
      `/api/post/create-update-delete-post?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Failed to fetch posts",
      posts: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };
  }
};

/**
 * Get a single post by ID
 * @param postId - ID of the post to fetch
 * @returns Promise with full post data
 */
export const getPostById = async (
  postId: string
): Promise<GetPostResponse> => {
  try {
    const response = await axiosInstance.get<GetPostResponse>(
      `/api/post/create-update-delete-post?id=${postId}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching post:", error);
    throw {
      success: false,
      message: error.response?.data?.message || "Failed to fetch post",
      post: null,
    };
  }
};

/**
 * Create a new post
 * @param payload - Post data to create
 * @returns Promise with created post data
 */
export const createPost = async (
  payload: CreatePostPayload
): Promise<CreatePostResponse> => {
  try {
    const response = await axiosInstance.post<CreatePostResponse>(
      "/api/post/create-update-delete-post",
      payload
    );

    return response.data;
  } catch (error: any) {
    console.error("Error creating post:", error);
    throw {
      success: false,
      message:
        error.response?.data?.message ||
        "Internal server error. Failed to create post.",
      errors: error.response?.data?.errors,
    };
  }
};

/**
 * Delete a post by ID
 * @param postId - ID of the post to delete
 * @returns Promise with deletion result
 */
export const deletePost = async (
  postId: string
): Promise<DeletePostResponse> => {
  try {
    const response = await axiosInstance.delete<DeletePostResponse>(
      "/api/post/create-update-delete-post",
      {
        data: { id: postId },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error deleting post:", error);
    throw {
      success: false,
      message:
        error.response?.data?.message ||
        "Internal server error. Failed to delete post.",
    };
  }
};

/**
 * Update an existing post by ID
 * @param payload - Post data to update (must include id)
 * @returns Promise with updated post data
 */
export const updatePost = async (
  payload: UpdatePostPayload
): Promise<UpdatePostResponse> => {
  try {
    const response = await axiosInstance.put<UpdatePostResponse>(
      "/api/post/create-update-delete-post",
      payload
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating post:", error);
    throw {
      success: false,
      message:
        error.response?.data?.message ||
        "Internal server error. Failed to update post.",
      errors: error.response?.data?.errors,
    };
  }
}