
import axiosInstance from "./axiosInstance";

export interface Category {
    _id: string;
    name: string;
    slug: string;
    color: string;
    parentCategory?: string | null | {
        _id: string;
        name: string;
        slug: string;
    }
    createdAt: string;
    updatedAt: string;
}

export interface GetCategoryResponse {
    success: boolean;
    category: Category;
    message: string;
}

export interface CreateCategoryPayload {
    name: string;
    slug: string;
    color?: string;
    parentCategory?: string | null;
}

export interface CreateCategoryResponse {
    success: boolean;
    message: string;
    category: {
        id: string;
        name: string;
        slug: string;
        color: string;
        parentCategory: string | null;
    };
    errors?: string[];
}


export interface UpdateCategoryPayload {
    id: string;
    name: string;
    slug: string;
    color?: string;
    parentCategory?: string | null;
}

export interface UpdateCategoryResponse {
    success: boolean;
    message: string;
    category: {
        id: string;
        name: string;
        slug: string;
        color: string;
        parentCategory: string | null;
    };
    errors?: string[];
}

export interface DeleteCategoryResponse {
    success: boolean;
    message: string;
}

/**
* Get a single category by ID
* @param categoryId - ID of the category to fetch
* @returns Promise with full category data
*/

export const getCategoryById = async (categoryId: string): Promise<GetCategoryResponse> => {
    try {
        const response = await axiosInstance.get<GetCategoryResponse>(`/api/post/category/create-update-category?id=${categoryId}`)
        return response.data;
    } catch (error: any) {
        console.error("Error fetching category:", error);
        throw {
            success: false,
            message: error.response?.data?.message || "Failed to fetch category",
            category: null,
        };
    }
}

/**
 * Create a new category
 * @param payload - Category data to create
 * @returns Promise with created category data
 */

export const createCategory = async (payload: CreateCategoryPayload): Promise<CreateCategoryResponse> => {
    try {
        const response = await axiosInstance.post<CreateCategoryResponse>(
            "/api/post/category/create-update-category",
            payload
        );

        return response.data;
    } catch (error: any) {
        console.error("Error creating category:", error);
        throw {
            success: false,
            message:
                error.response?.data?.message ||
                "Internal server error. Failed to create category.",
            errors: error.response?.data?.errors,
        }
    }
}


/**
 * Update an existing category by ID
 * @param payload - Category data to update (must include id)
 * @returns Promise with updated category data
 */
export const updateCategory = async (
    payload: UpdateCategoryPayload
): Promise<UpdateCategoryResponse> => {
    try {
        const response = await axiosInstance.put<UpdateCategoryResponse>(
            "/api/post/category/create-update-category",
            payload
        );

        return response.data;
    } catch (error: any) {
        console.error("Error updating category:", error);
        throw {
            success: false,
            message:
                error.response?.data?.message ||
                "Internal server error. Failed to update category.",
            errors: error.response?.data?.errors,
        };
    }
};


/**
 * Delete a category by ID
 * @param categoryId - ID of the category to delete
 * @returns Promise with deletion result
 */

export const deleteCategory = async (categoryId: string): Promise<DeleteCategoryResponse> => {
    try {
        const response = await axiosInstance.delete<DeleteCategoryResponse>(
            `/api/post/category/create-update-category`, {
            data: { id: categoryId }
        }
        )

        return response.data;
    } catch (error: any) {
        console.error("Error deleting category:", error);
        throw {
            success: false,
            message:
                error.response?.data?.message ||
                "Internal server error. Failed to delete category.",
        };

    }
}