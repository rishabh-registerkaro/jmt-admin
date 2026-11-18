import axiosInstance from "./axiosInstance";
import { getApiErrorBody } from "./apiError";

export interface AdminRoleDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  /** Super Admin — permissions can't be edited. */
  locked: boolean;
  userCount: number;
  /** The signed-in user may give this role to someone. */
  assignable: boolean;
}

export interface ListRolesResponse {
  success: boolean;
  roles?: AdminRoleDTO[];
  /** False until `npm run seed:roles` has run. */
  seeded?: boolean;
  message?: string;
}

export interface RoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

type Result = { success: boolean; message?: string };

export const listRoles = async (opts: { assignable?: boolean } = {}): Promise<ListRolesResponse> => {
  try {
    const res = await axiosInstance.get<ListRolesResponse>(`/api/roles${opts.assignable ? "?assignable=1" : ""}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getApiErrorBody(error)?.message || "Failed to load roles" };
  }
};

export const createRole = async (input: RoleInput): Promise<Result> => {
  try {
    return (await axiosInstance.post<Result>("/api/roles", input)).data;
  } catch (error) {
    return { success: false, message: getApiErrorBody(error)?.message || "Failed to create role" };
  }
};

export const updateRole = async (id: string, input: Partial<RoleInput>): Promise<Result> => {
  try {
    return (await axiosInstance.put<Result>(`/api/roles/${id}`, input)).data;
  } catch (error) {
    return { success: false, message: getApiErrorBody(error)?.message || "Failed to update role" };
  }
};

export const deleteRole = async (id: string): Promise<Result> => {
  try {
    return (await axiosInstance.delete<Result>(`/api/roles/${id}`)).data;
  } catch (error) {
    return { success: false, message: getApiErrorBody(error)?.message || "Failed to delete role" };
  }
};
